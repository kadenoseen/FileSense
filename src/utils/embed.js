// Import required modules and packages
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from './pinecone-client.js';
import { FileLoader } from './fileLoader.js';
import { createIndex, deleteIndex } from './requests.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Main function to process input files and create embeddings
export const run = async (buffers, apiKey) => {
  try {
    console.log("Creating index...");
    // Create a new Pinecone index
    const indexName = await createIndex();
    console.log(`Index created: ${indexName}\nInitializing...`);

    // Initialize the Pinecone index
    const index = pinecone.Index(indexName);

    // Create FileLoader instances for each input file
    const fileLoaders = buffers.map((buffer) => new FileLoader(buffer));

    // Load the contents of the files
    const rawDocs = await Promise.all(fileLoaders.map((loader) => loader.load()));
    
    // Merge the loaded documents into a single array
    const mergedDocs = rawDocs.flat();

    // Initialize the text splitter with the desired configuration
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1300,
      chunkOverlap: 200,
    });

    // Split the documents into smaller chunks
    const docs = await textSplitter.splitDocuments(mergedDocs);
    
    console.log('creating vector store...');
    console.log(apiKey);

    // Initialize the OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({openAIApiKey: apiKey});
    let complete = false;

    // Loop until the Pinecone store is successfully created
    while (!complete) {
      try {
        // Create the Pinecone store from the documents and embeddings
        await PineconeStore.fromDocuments(docs, embeddings, {
          pineconeIndex: index,
          textKey: 'text',
        });
        console.log("Index initialized successfully.");
        complete = true;
      } catch (error) {
        // Wait for 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Index not ready, retrying...');
        continue;
      }
    }

    // Schedule index deletion after 15 minutes
    setTimeout(async () => {
      await deleteIndex(indexName);
    }, 15 * 60 * 1000);

    // Return the index name
    return indexName;

  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};
