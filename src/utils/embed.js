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
    const mergedDocs = rawDocs.flat();

    // Initialize the text splitter with the desired configuration
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1300,
      chunkOverlap: 200,
    });

    // Split the documents into smaller chunks
    const docs = await textSplitter.splitDocuments(mergedDocs);
    
    console.log('Creating vector store...');

    // Initialize the OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({openAIApiKey: apiKey});
    let complete = false;
    const namespace = generateRandomString();
    // Loop until the Pinecone store is successfully created
    try {
      // Create the Pinecone store from the documents and embeddings
      await PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex: index,
        namespace: namespace,
      });
      complete = true;
    } catch (error) {
      console.log('Index not ready, retrying...');
    }
    return namespace;

  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};