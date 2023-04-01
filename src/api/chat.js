// Import required modules
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { makeChain } from '../chains/makechain.js';
import { pinecone } from '../utils/pinecone-client.js';
import readline from 'readline';

// Create readline interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask a question and get a response using the provided index name and API key
export async function askQuestion(question, indexName, apiKey) {
  console.log(`Index Name: ${indexName}`);
  const index = pinecone.Index(indexName);
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({ openAIApiKey: apiKey }),
    {
      pineconeIndex: index,
      textKey: 'text',
    },
  );
  const chain = makeChain(vectorStore, apiKey);

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
