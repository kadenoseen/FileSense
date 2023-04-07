// Import required modules and packages
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { pinecone } from './pinecone-client.js';
import { FileLoader } from './fileLoader.js';
import { describeIndexStats, deleteVectors, generateRandomString } from './requests.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Main function to process input files and create embeddings
export const run = async (buffers, apiKey) => {
  try {
    
    // Initialize the Pinecone index
    const index = pinecone.Index(process.env.PINECONE_INDEX);
    let vectorCount = 0;
    const indexStats = await describeIndexStats();
    if (indexStats) {
      vectorCount = indexStats.totalVectorCount || 0;
    }
    const namespaces = Object.keys(indexStats.namespaces);
    console.log(indexStats.namespaces);
    // delete vectors if they exist
    if(vectorCount > 900){
      await deleteVectors(namespaces);
    }
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
    
    console.log('creating vector store...');

    // Initialize the OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({openAIApiKey: apiKey});
    let complete = false;
    const namespace = generateRandomString();
    // Loop until the Pinecone store is successfully created
    while (!complete) {
      try {
        // Create the Pinecone store from the documents and embeddings
        await PineconeStore.fromDocuments(docs, embeddings, {
          pineconeIndex: index,
          namespace: namespace,
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
      await deleteAllVectors();
    }, 10 * 60 * 1000);

    return namespace;

  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};