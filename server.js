// Import required packages
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { run as processFiles } from './src/utils/embed.js';
import { askQuestion } from './src/api/chat.js';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import documentationFinder from './src/utils/documentation/documentationFinder.js';
import { createFileHash, createUrlHash } from './src/utils/fileHash.js';

// Load environment variables from .env file
dotenv.config();

// Initialize hash to index mappings for files and URLs
const fileHashToIndex = {};
const urlHashToIndex = {};

// Initialize Express app and enable CORS
const app = express();
app.use(cors());

// Set up multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

// Enable JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static('public'));

// Default route for serving the index.html file
app.get('*', (req, res) => {
  res.sendFile('public/index.html');
});

// Route for processing uploaded files and creating embeddings
app.post('/api/process-files', upload.array('files'), async (req, res) => {
  try {
    // Convert uploaded files to buffers
    const files = req.files.map((file) => Buffer.from(file.buffer));
    // Generate a hash for the uploaded files
    const fileHash = createFileHash(req.files);
    let apiKey = req.body.apiKey;
    // Check if the provided API key matches the configured password
    if(createUrlHash(apiKey) === process.env.PASSWORD){
      apiKey = process.env.OPEN_API;
    }
    let index = "";
    // Check if the files have been processed before
    if (fileHashToIndex[fileHash]) {
      console.log("File already processed");
      index = fileHashToIndex[fileHash];
    } else {
      // Process files and create embeddings
      index = await processFiles(files, apiKey);
      // Save the index in the file hash to index mapping
      fileHashToIndex[fileHash] = index;
    }
    // Return success response
    res.status(200).json({ message: 'Files processed successfully', fileHash });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ message: 'Error processing files' });
  }
});

// Route for asking a question using the chat API
app.post("/ask", async (req, res) => {
  try {
    let { question, fileHash, apiKey } = req.body;
    // Check if the API key matches the configured password
    if(createUrlHash(apiKey) === process.env.PASSWORD){
      apiKey = process.env.OPEN_API;
    }
    // Check if required fields are provided
    if (!question || !fileHash || !apiKey) {
      res.status(400).json({ error: "Invalid question, file hash, or API key" });
      return;
    }

    // Get the index associated with the file hash
    const index = fileHashToIndex[fileHash];
    // Call the chat API with the question, index, and API key
    const response = await askQuestion(question, index, apiKey);
    // Return the response from the chat API
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for testing the provided API key
async function testApiKey(apiKey) {
  if(createUrlHash(apiKey) === process.env.PASSWORD){
    return true;
  }
  try {
    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);
    await openai.listModels();
    return true;
  } catch (error) {
    return false;
  }
}

// Set the port and start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

