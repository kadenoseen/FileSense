// Import required modules
import { OpenAIChat } from 'langchain/llms';
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

// Define the prompt templates
const CONDENSE_PROMPT = PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided.
You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.
If you can't find the answer in the context below, just say "I'm not sure." Don't try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

Question: {question}
=========
{context}
=========
Answer in Markdown:`);

// Function to create a chain for handling questions and answers
export const makeChain = (vectorstore, apiKey) => {
  // Create a question generator using the condense prompt
  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0, openAIApiKey: apiKey }),
    prompt: CONDENSE_PROMPT,
  });

  // Create a document chain using the QA prompt
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
      openAIApiKey: apiKey,
    }),
    { prompt: QA_PROMPT },
  );

  // Combine the chains into a ChatVectorDBQAChain
  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 2, // Number of source documents to return
  });
};
