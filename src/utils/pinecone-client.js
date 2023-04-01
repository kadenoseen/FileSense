// Import required modules
import { PineconeClient } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if Pinecone API key is present
if (!process.env.PINECONE_API_KEY) {
  throw new Error('Pinecone api key missing');
}

// Function to initialize Pinecone client
async function initPinecone() {
  try {
    // Create a new PineconeClient instance
    const pinecone = new PineconeClient();

    // Initialize the Pinecone client with the API key and environment
    await pinecone.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: "us-west4-gcp",
    });

    // Return the initialized Pinecone client
    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}

// Export an initialized Pinecone client instance
export const pinecone = await initPinecone();
