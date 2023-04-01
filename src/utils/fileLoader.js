// Import required modules and packages
import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { BaseDocumentLoader } from 'langchain/document_loaders';

// BufferLoader class extending BaseDocumentLoader to handle file loading from different sources
export class BufferLoader extends BaseDocumentLoader {
  constructor(filePathOrBlob) {
    super();
    this.filePathOrBlob = filePathOrBlob;
  }
  
  // Load the content from the source (file path, buffer, or blob) and parse it
  async load() {
    let buffer;
    let metadata;

    // Check if the input is a file path (string)
    if (typeof this.filePathOrBlob === 'string') {
      buffer = await readFile(this.filePathOrBlob);
      metadata = { source: this.filePathOrBlob };
    }
    // Check if the input is a buffer
    else if (Buffer.isBuffer(this.filePathOrBlob)) {
      buffer = this.filePathOrBlob;
      metadata = { source: 'buffer' };
    }
    // Assume the input is a blob
    else {
      buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }

    // Parse the buffer and metadata
    return this.parse(buffer, metadata);
  }
}

// FileLoader class extending BufferLoader to handle PDF file parsing
export class FileLoader extends BufferLoader {
  async parse(raw, metadata) {
    // Import the pdf-parse library
    const { pdf } = await FileLoaderImports();

    // Parse the raw PDF content
    const parsed = await pdf(raw);

    // Create a new Document with the parsed content and metadata
    return [
      new Document({
        pageContent: parsed.text,
        metadata: {
          ...metadata,
          pdf_numpages: parsed.numpages,
        },
      }),
    ];
  }
}

// Function to load pdf-parse library dynamically
async function FileLoaderImports() {
  try {
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    return { pdf };
  } catch (e) {
    console.error(e);
  }
}
