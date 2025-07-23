const input = document.getElementById('questionInput');
const sendBtn = document.getElementById('sendButton');
const hintBox = document.getElementById('hintBox');

function sendQuestion() {
  const question = input.value.trim();
  if (question) {
    console.log("User asked:", question);
    input.value = '';
    hintBox.value="Extracting Answer..."
  }

}

  // chrome.storage.sync.get(["geminiApiKey"], async (result) => {
  //   if (!result.geminiApiKey) {
  //     hintBox.innerHTML =
  //       "API key not found. Please set your API key in the extension options.";
  //     return;
  //   }



// Send message to content script
function fetchLeetCodeData() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_HINT_DATA' }, function (response) {
      if (chrome.runtime.lastError || !response) {
        hintBox.textContent = '❌ Failed to fetch problem data.';
        return;
      }

      const { title, description, solution } = response;
    });
  });
}

// Event Listeners
sendBtn.addEventListener('click', sendQuestion);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendQuestion();
  }
});

// Fetch data when popup opens
document.addEventListener('DOMContentLoaded', fetchLeetCodeData);
