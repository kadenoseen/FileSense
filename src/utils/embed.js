// Import required modules and packages
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from './pinecone-client.js';
import { FileLoader } from './fileLoader.js';
import { generateRandomString } from './requests.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Main function to process input files and create embeddings
export const run = async (buffers, apiKey) => {
  try {
    
    // Initialize the Pinecone index
    const index = pinecone.Index(process.env.PINECONE_INDEX);

    // Create Loader instances for each input file
    const fileLoaders = buffers.map((buffer) => new FileLoader(buffer));

    // Load the contents of the files
    const rawDocs = await Promise.all(fileLoaders.map((loader) => loader.load()));
    
    // Merge the loaded documents into a single array
    const mergedNotFormatted = rawDocs.flat();

    const mergedDocs = mergedNotFormatted.join('\n\n');

    class CustomTextSplitter {
      constructor({ chunkSize, chunkOverlap }) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
      }
    
      async splitDocuments(text) {
        const chunks = [];
        const regex = /(\.|\?|\!)\s/;
        const sentences = text.split(regex);
        
        let index = 0;
        while (index < sentences.length) {
          let chunk = '';
          let nextIndex = index;
          
          while (chunk.length < this.chunkSize && nextIndex < sentences.length) {
            chunk += sentences[nextIndex] + (regex.test(sentences[nextIndex + 1]) ? sentences[nextIndex + 1] : '');
            nextIndex += 2;
          }
          
          if (this.chunkOverlap > 0 && index > 0) {
            let overlap = '';
            let overlapIndex = Math.max(0, index - this.chunkOverlap);
            
            while (overlap.length < this.chunkOverlap && overlapIndex < index) {
              overlap += sentences[overlapIndex] + (regex.test(sentences[overlapIndex + 1]) ? sentences[overlapIndex + 1] : '');
              overlapIndex += 2;
            }
            
            chunk = overlap + chunk;
          }
          
          chunks.push(chunk);
          index = nextIndex;
        }
        
        return chunks;
      }
    }
    
    /*function getDynamicChunkSizeAndOverlap(documentSize) {
      let chunkSize, chunkOverlap;
    
      if (documentSize <= 50000) { // For smaller documents (up to 50,000 characters)
        chunkSize = 2000;
        chunkOverlap = 200;
      } else if (documentSize <= 200000) { // For medium-sized documents (50,000 to 200,000 characters)
        chunkSize = 3000;
        chunkOverlap = 300;
      } else { // For large documents (over 200,000 characters)
        chunkSize = 5000;
        chunkOverlap = 500;
      }
    
      return { chunkSize, chunkOverlap };
    }
    
    // Usage
    const documentSize = mergedDocs.length;
    const { chunkSize, chunkOverlap } = getDynamicChunkSizeAndOverlap(documentSize);
    */
    const textSplitter = new CustomTextSplitter({
      chunkSize: 1300,
      chunkOverlap: 200,
    });
    
    // Split the documents into smaller chunks
    const docs = await textSplitter.splitDocuments(mergedDocs);
    
    
    console.log('Creating vector store...');

    // Initialize the OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({openAIApiKey: apiKey});
    const namespace = generateRandomString();

    try {
      // Create the Pinecone store from the documents and embeddings
      await PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex: index,
        namespace: namespace,
      });
    } catch (error) {
      console.log(error);
    }
    return namespace;

  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};