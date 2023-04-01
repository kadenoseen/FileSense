let key = null;
let urlHash = null;
const url = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.getElementById('submit-button');
  const textInput = document.getElementById('text-input');
  const apiKeyInput = document.getElementById('api-key-input');
  const loadingContainer = document.getElementById('loading-container');
  const chat = document.getElementById('chat');
  const content = document.getElementById('content');
  
  submitButton.addEventListener('click', async () => {
    const text = textInput.value;
    const apiKey = apiKeyInput.value;

    if (!text || !apiKey) {
      alert('Please provide both the url and API key');
      return;
    }
    const valid = testApiKey(apiKey);
    if (!valid) {
      alert('Invalid API key');
      return;
    }
    key = apiKey;

    loadingContainer.classList.remove('hidden');

    const response = await fetch('/getDocs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, apiKey }),
    });

    const data = await response.json();
    console.log(data);
    urlHash = data.urlHash;

    loadingContainer.classList.add('hidden');

    // Show the chat interface and hide the URL input interface and API key input
    textInput.parentElement.classList.add('hidden');
    apiKeyInput.parentElement.classList.add('hidden');
    chat.classList.remove('hidden');
    content.classList.add('no-padding');
    updateContentWrapperPadding();

  });
});

function updateContentWrapperPadding() {
  const contentWrapper = document.querySelector('.content-wrapper');
  contentWrapper.style.paddingTop = '0%';
}


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

function toggleModalOpen() {
  document.body.classList.toggle("modal-open");
}

// Event listener for the help button click
document.getElementById("help-button").addEventListener("click", () => {
  document.getElementById("api-key-modal").style.display = "block";
  toggleModalOpen();
});

// Function to close the modal when clicking outside the content or on the content itself
function closeModal(event) {
  if (event.target === document.getElementById("api-key-modal") || event.target === document.querySelector(".modal-content")) {
    document.getElementById("api-key-modal").style.display = "none";
    toggleModalOpen();
  }
}

// Event listeners for closing the modal on click or touch events
window.addEventListener("click", closeModal);
window.addEventListener("touchend", closeModal);