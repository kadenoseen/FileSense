let fileHash = null;
let apiKey = null;
const url = "http://localhost:3000";

// Event listener for file input change
document.getElementById("file-input").addEventListener("change", (event) => {
  const files = event.target.files;
  const processButton = document.getElementById("submit-button");

  if (files.length > 0) {
    // Show the "Upload successful" message
    const successMessage = document.createElement("div");
    successMessage.id = "success-message";
    successMessage.innerText = "Upload successful";
    successMessage.style.marginTop = "5px"; // Move the text 5 pixels down
    document.getElementById("file-upload").appendChild(successMessage);

    // Change the background color of the "Process Files" button to blue
    processButton.style.backgroundColor = "#4CAF50";
  } else {
    // Remove the "Upload successful" message if it exists
    const successMessage = document.querySelector("#file-upload div");
    if (successMessage) {
      document.getElementById("file-upload").removeChild(successMessage);
    }

    // Reset the background color of the "Process Files" button
    processButton.style.backgroundColor = "";
  }
});

// Event listener for the "Process Files" button click
document.getElementById("submit-button").addEventListener("click", async () => {
  const files = document.getElementById("file-input").files;
  document.getElementById("success-message").classList.add("hidden");

  if (files.length === 0) {
    alert("No files selected");
    return;
  }
  const key = document.getElementById("api-key-input").value;
  if (!key) {
    alert("Please enter your OpenAI API key in the field provided.");
    return;
  }
  document.getElementById("loading-container").classList.remove("hidden");
  const isValid = await testApiKey(key);
  if (!isValid) {
    document.getElementById("loading-container").classList.add("hidden");
    alert("Invalid API key");
    return;
  }

  apiKey = key;

  // Process the files and create embeddings
  const response = await sendFiles(files, key);
  fileHash = response.fileHash;

  // Hide the loading gif
  document.getElementById("loading-container").classList.add("hidden");

  // Show the chat interface and hide the file upload interface and API key input
  document.getElementById("file-upload").classList.add("hidden");
  document.getElementById("chat").classList.remove("hidden");
  document.getElementById("content").classList.add("no-padding");
  document.getElementById("api-key-input").parentElement.classList.add("hidden");

  updateContentWrapperPadding();
});

// Update the padding of the content wrapper
function updateContentWrapperPadding() {
  const contentWrapper = document.querySelector(".content-wrapper");
  contentWrapper.getElementsByClassName.paddingTop = "0%";
}

// Function to generate a unique ID for each source popup
function generateUniqueId(prefix = "source-popup") {
  return `${prefix}-${Math.random().toString(36).substr(2, 10)}`;
}

// Function to send a message
async function sendMessage() {
  const userInput = document.getElementById("user-input");

  const message = userInput.value.trim();

  if (!message) return;

  // Display user message
  const chatHistory = document.getElementById("chat-history");
  chatHistory.innerHTML += `<div class="user-message">${message}</div>`;

  // Clear the input field
  userInput.value = "";

  // Show the "..." message
  const typingMessage = document.createElement("div");
  typingMessage.classList.add("ai-message");
  chatHistory.appendChild(typingMessage);

  let typingDots = 0;
  const typingInterval = setInterval(() => {
    if (typingDots === 4) typingDots += 1;
    typingDots = (typingDots + 1) % 5;
    typingMessage.innerHTML = `${".".repeat(typingDots)}`;
  }, 500);

  try {
    // Get the response from the AI model
    const aiResponse = await sendQuestion(message, fileHash);
    const sources = Array.isArray(aiResponse.sourceDocuments) ? aiResponse.sourceDocuments.map((doc, index) => {
      const content = doc.pageContent || 'Unknown Content';
      return `<div class="source-content">${index + 1}: ${content}</div>`;
    }).join('') : 'Unknown Source';

    // Clear the typing message and interval
    clearInterval(typingInterval);
    chatHistory.removeChild(typingMessage);
    
    // Display AI response
    const aiResponseMessage = `<div class="ai-message">${aiResponse.text}<button class="sources-button" id="show-sources onclick="showSources()">Sources</button></div>`;
    chatHistory.innerHTML += aiResponseMessage;

    // Update the popup content
    document.getElementById('popup-content').innerHTML = sources;
  } catch (error) {
    console.error("Error:", error);
    chatHistory.innerHTML += `<div>Sorry, an error occurred while processing your request.</div>`;
  }

  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showSources() {
  const popup = document.getElementById('source-popup');
  popup.style.display = 'block';

  const closeButton = popup.querySelector('.close');
  closeButton.onclick = () => {
    popup.style.display = 'none';
  };
}

document.addEventListener("click", (event) => {
  const popup = document.getElementById("source-popup");

  if (event.target.classList.contains("sources-button")) {
    const sourcesButton = event.target;
    if (popup.style.display === "none" || popup.style.display === "") {
      popup.style.display = "block";
    } else if (popup.style.display === "block") {
      popup.style.display = "none";
    }
  } else if (popup.style.display === "block") {
    popup.style.display = "none";
  }
});


// Event listener for the "Send" button click
document.getElementById("send-button").addEventListener("click", sendMessage);

// Event listener for the "Enter" key press
document.getElementById("user-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// Function to send files and the API key to the server for processing
async function sendFiles(files, apiKey) {
  const formData = new FormData();
  
  // Append each file to the form data
  for (const file of files) {
    formData.append("files", file);
  }

  // Append the API key to the form data
  formData.append("apiKey", apiKey);

  try {
    // Send the POST request to the server
    const response = await fetch(url + "/api/process-files", {
      method: "POST",
      body: formData,
    });

    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error("Error processing files");
    }
    // Return the JSON response
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Function to send the user's question, the file hash, and the API key to the server
async function sendQuestion(question, fileHash) {
  const response = await fetch(url + "/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, fileHash, apiKey }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  return await response.json();
}

// Function to test if the provided API key is valid
async function testApiKey(apiKey) {
  try {
    const response = await fetch(url + '/api/test-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const result = await response.json();
    return result.valid;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Event listener for the help button click
document.getElementById("help-button").addEventListener("click", () => {
  document.getElementById("api-key-modal").style.display = "block";
  
});

// Function to close the modal when clicking outside the content or on the content itself
function closeModal(event) {
  if (event.target === document.getElementById("api-key-modal") || event.target === document.querySelector(".modal-content")) {
    document.getElementById("api-key-modal").style.display = "none";
  }
}

// Event listeners for closing the modal on click or touch events
window.addEventListener("click", closeModal);
window.addEventListener("touchend", closeModal);