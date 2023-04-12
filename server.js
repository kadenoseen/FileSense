import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { run as processFiles } from './src/utils/embed.js';
import { askQuestion } from './src/api/chat.js';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import { createFileHash, createUrlHash } from './src/utils/getHash.js';
import { deleteVector, deleteAllVectors } from './src/utils/requests.js';

dotenv.config();
deleteAllVectors();
let savedHashes = {};

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('*', (req, res) => {
  res.sendFile('public/index.html');
});

function scheduleDeletion(fileHash) {
  const twoDaysInMilliseconds = 48 * 60 * 60 * 1000;
  setTimeout(async () => {
    try {
      delete savedHashes[fileHash];
      await deleteVector(savedHashes[fileHash]);
      console.log(`Deleted namespace ${fileHash} after 48 hours.`);
    } catch (error) {
      console.error(`Error deleting namespace:`, error);
    }
  }, twoDaysInMilliseconds);
}

app.post('/api/process-files', upload.array('files'), async (req, res) => {
  try {
    const files = req.files.map((file) => Buffer.from(file.buffer));
    const fileHash = createFileHash(req.files);
    let apiKey = req.body.apiKey;
    if(createUrlHash(apiKey) === process.env.PASSWORD){
      apiKey = process.env.OPEN_API;
    }

    if (savedHashes[fileHash]) {
      console.log("File already processed");
    }else{
      savedHashes[fileHash] = await processFiles(files, apiKey);
      scheduleDeletion(fileHash);
    }
    res.status(200).json({ message: 'Files processed successfully', fileHash });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ message: 'Error processing files' });
  }
});

app.post("/ask", async (req, res) => {
  try {
    let { question, fileHash, apiKey } = req.body;
    if(createUrlHash(apiKey) === process.env.PASSWORD){
      apiKey = process.env.OPEN_API;
    }
    if (!question || !fileHash || !apiKey) {
      res.status(400).json({ error: "Invalid question, file hash, or API key" });
      return;
    }
    if(!savedHashes[fileHash]){
      res.status(400).json({ error: "File hash not found" });
      return;
    }

    const response = await askQuestion(question, savedHashes[fileHash], apiKey);
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/test-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      res.status(400).json({ error: 'API key is required' });
      return;
    }
    const isValid = await testApiKey(apiKey);
    res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
