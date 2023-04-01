import puppeteer from 'puppeteer';
import { pinecone } from "../pinecone-client.js";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { createIndex, deleteIndex } from '../requests.js';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

let val = 0;

async function fetchHTML(url) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const bodyHandle = await page.$('body');
    const html = await page.evaluate(body => body.innerHTML, bodyHandle);
    await bodyHandle.dispose();
    await browser.close();

    return html;
  } catch (error) {
    console.error(`Error fetching data from URL: ${url}`);
    throw error;
  }
}

async function extractVisibleText(page) {
  try {
    const visibleText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: node => {
          const isWhiteSpace = /^\s*$/.test(node.textContent);
          const isVisible = !!(node.parentElement && window.getComputedStyle(node.parentElement).display !== 'none');
          return isWhiteSpace || !isVisible ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        },
      });

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode.textContent);
      }

      return textNodes.join('\n');
    });

    return visibleText;
  } catch (error) {
    console.error(`Error extracting visible text from page`);
    throw error;
  }
}

async function processPage(url, apiKey, visited, maxDepth, currentDepth = 0) {
  try {
    if (currentDepth > maxDepth) {
      return;
    }

    if (visited.has(url)) {
      return;
    }

    visited.add(url);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const visibleText = await extractVisibleText(page);
    console.log(visibleText);
    val += visibleText.length;
    const urls = await page.$$eval('a', links => links.map(link => link.href));
    for (const newUrl of urls) {
      if (newUrl.startsWith('http') && !visited.has(newUrl)) {
        await processPage(newUrl, apiKey, visited, maxDepth, currentDepth + 1);
      }
    }

    await browser.close();
  } catch (error) {
    console.error(`Error processing page: ${url}`);
    throw error;
  }
}

async function runScrapedText(text, apiKey) {
    try {
      console.log("Creating index...");
      const indexName = await createIndex();
      console.log(`Index created: ${indexName}\nInitializing...`);
      const index = pinecone.Index(indexName);
  
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
  
      const docs = await textSplitter.splitDocuments([{ text }]);
  
      console.log('creating vector store...');
      console.log(apiKey);
      const embeddings = new OpenAIEmbeddings({ openAIApiKey: apiKey });
      let complete = false;
  
      while (!complete) {
        try {
          await PineconeStore.fromDocuments(docs, embeddings, {
            pineconeIndex: index,
            textKey: 'text',
          });
          console.log("Index initialized successfully.");
          complete = true;
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          console.log('Index not ready, retrying...');
          continue;
        }
      }
      setTimeout(async () => {
        await deleteIndex(indexName);
      }, 10 * 60 * 1000);
      return indexName;
  
    } catch (error) {
      console.log('error', error);
      throw new Error('Failed to ingest your data');
    }
  }
  
export default async function scraper(url, apiKey, maxDepth = 1) {
    try {
        const visited = new Set();
        const visibleTextChunks = [];
        await processPage(url, apiKey, visited, maxDepth, 0, visibleTextChunks);

        let scrapedText = visibleTextChunks.join('\n');
        if (scrapedText.length > 100000) {
            scrapedText = scrapedText.substring(0, 100000);
        }
        console.log("Scraped " + url);
        const indexName = await runScrapedText(scrapedText, apiKey);
        return indexName;
    } catch (error) {
        console.error(`Error scraping data from URL: ${url}`);
        throw error;
    }
}