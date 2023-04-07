// Import required modules
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { makeChat } from './makechat.js';
import { pinecone } from '../utils/pinecone-client.js';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

// Create readline interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask a question and get a response using the provided index name and API key
export async function askQuestion(question, namespace, apiKey) {
  const index = pinecone.Index(process.env.PINECONE_INDEX);
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({ openAIApiKey: apiKey }),
    {
      pineconeIndex: index,
      namespace: namespace,
    },
  );

  const chain = makeChat(vectorStore, apiKey);

  try {
    const response = await chain.call({
      question,
      chat_history: [],
    });
    return response;

  } catch (error) {
    console.log('error', error);
    throw error;
  }
}
