// Import required modules
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const url = `https://${process.env.PINECONE_INDEX}-d7c3cfe.svc.us-west4-gcp.pinecone.io/vectors/delete`;

export async function deleteAllVectors(){
  const indexStats = await describeIndexStats();
  const namespaces = Object.keys(indexStats.namespaces);
  await deleteVectors(namespaces);
}

// Function to check number of vectors in index
export async function describeIndexStats() {
  const url = `https://${process.env.PINECONE_INDEX}-d7c3cfe.svc.us-west4-gcp.pinecone.io/describe_index_stats`;

    try {
      const response = await axios.post(url, {}, {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'accept': 'application/json',
          'content-type': 'application/json',
        },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        console.error('Error retrieving index stats:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error retrieving index stats:', error.message);
      return null;
    }
}


// Function to delete all vectors in index
export async function deleteVectors(namespaces) {
  try {
    for(let i = 0; i < namespaces.length; i++){
      deleteVector(namespaces[i]);
    }
    return true;
  } catch (error) {
    console.error('Error deleting all vectors:', error);
    throw error;
  }
}


export async function deleteVector(namespace){
  const response = await axios.post(
    url,
    { deleteAll: true, namespace: namespace },
    {
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
    }
  );
  if (response.status === 200) {
    console.log(`Deleted all vectors in namespace ${namespace}`);
    return true;
  } else {
    console.log(`Error deleting  vectors in namespace ${namespace}.`);
    return false;
  }
}

// generates random string
export function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}