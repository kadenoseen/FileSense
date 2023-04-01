// Import required modules
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to delete a Pinecone index
export async function deleteIndex(indexName) {
  console.log('Deleting index', indexName);

  // Make a DELETE request to the Pinecone API
  const response = await fetch(`https://controller.us-west4-gcp.pinecone.io/databases/${indexName}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'text/plain',
      'Api-Key': process.env.PINECONE_API_KEY,
    },
  });

  // Check if the deletion was successful
  if (response.ok) {
    console.log('Index deleted successfully');
  } else {
    console.error('Error deleting index:', response.statusText);
  }
}

// Function to create a Pinecone index
export async function createIndex() {
  // Generate a unique index name
  const indexName = `testing-${uuidv4()}`;

  // Define index configuration data
  const indexData = {
    "metric": "cosine",
    "pods": 1,
    "replicas": 1,
    "pod_type": "p1.x1",
    "name": indexName,
    "dimension": 1536
  };

  // Make a POST request to the Pinecone API to create the index
  const response = await fetch('https://controller.us-west4-gcp.pinecone.io/databases', {
    method: 'POST',
    headers: {
      'Accept': 'text/plain',
      'Content-Type': 'application/json',
      'Api-Key': process.env.PINECONE_API_KEY,
    },
    body: JSON.stringify(indexData),
  });

  // Check if the index was created successfully
  if (response.ok) {
    console.log('Index created successfully');
    return indexName;
  } else {
    console.error('Error creating index:', response.statusText);
    return null;
  }
}
