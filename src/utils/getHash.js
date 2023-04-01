// Import the required crypto module
import crypto from 'crypto';

// Function to create a hash based on the input files
export function createFileHash(files) {
  // Create a SHA-256 hash object
  const hasher = crypto.createHash('sha256');

  // Concatenate file names
  const fileNames = files.map(file => file.originalname).join('');

  // Update the hash with the concatenated file names
  hasher.update(fileNames);

  // Return the hash digest in hexadecimal format
  return hasher.digest('hex');
}

// Function to create a hash based on the input URL
export function createUrlHash(url) {
  // Create a SHA-256 hash object
  const hasher = crypto.createHash('sha256');

  // Update the hash with the input URL
  hasher.update(url);

  // Return the hash digest in hexadecimal format
  return hasher.digest('hex');
}
