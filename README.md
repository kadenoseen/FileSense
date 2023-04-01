# FileSense

Created by Kaden Oseen, 2023

FileSense is an AI-powered search application that allows users to search for information within multiple uploaded documents. Users can ask questions in a conversational manner, and the AI will provide relevant answers based on the uploaded documents. This project uses OpenAI's GPT-3.5 or GPT-4 language model for generating answers.


## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)


## Requirements

- Node.js (v18.x or later)
- An OpenAI API key (sign up at https://platform.openai.com/signup/)
- Pinecone API key (sign up at https://www.pinecone.io/)


## Installation

1. Clone this repository:
```git clone https://github.com/kadenoseen/FileSense.git```
2. Navigate to the project directory:
```cd filesense```
3. Install the dependencies:
```npm install```


## Usage

1. Add your OpenAI API key to the `.env` file:
```PINECONE_API_KEY="pinecone_api_here"```
```OPEN_API="openai_api_here"```
```PASSWORD="hashed_password_here"```
2. Start the server:
```npm start```
3. Open your browser and navigate to http://localhost:3000.
4. Enter your OpenAI API key and upload your documents.
5. Click "Process Files" to create document embeddings.
6. Use the chat interface to ask questions related to your uploaded documents.


## API Endpoints

### `/api/process-files`
- Method: POST
- Description: Processes and indexes the uploaded files.
- Request body: Form data containing an array of files and the API key.
- Response: JSON object containing the file hash.

### `/ask`
- Method: POST
- Description: Sends a user question to the AI model and returns an answer.
- Request body: JSON object containing the question, file hash, and API key.
- Response: JSON object containing the AI-generated answer.

### `/api/test-api-key`
- Method: POST
- Description: Tests the API key to ensure it is valid.
- Request body: JSON object containing the API key.
- Response: JSON object containing validity bool.


## Contributing

If you'd like to contribute, please fork the repository and make changes as you'd like. Pull requests are warmly welcome.
