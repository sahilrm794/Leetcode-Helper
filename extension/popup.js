// ============================================
// LeetCode Helper - Popup Script
// ============================================

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const questionInput = document.getElementById('questionInput');
const sendButton = document.getElementById('sendButton');
const notLeetcode = document.getElementById('notLeetcode');
const chatContainer = document.getElementById('chatContainer');
const inputArea = document.getElementById('inputArea');
const statusBar = document.getElementById('statusBar');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const saveStatus = document.getElementById('saveStatus');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');

// State
let currentUser = null;
let currentProblem = null;
let conversationHistory = [];
let currentProblemId = null;
let isLoading = false;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth state
  await checkAuthState();

  // Check if on LeetCode problem page
  const isOnLeetCode = await checkIfOnLeetCode();

  if (!isOnLeetCode) {
    showNotLeetCodeMessage();
    return;
  }

  // Fetch initial hint
  await fetchInitialHint();
});

// ============================================
// LeetCode Check
// ============================================

async function checkIfOnLeetCode() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        resolve(false);
        return;
      }

      const url = tabs[0].url || '';
      const isLeetCode = url.includes('leetcode.com/problems/');
      resolve(isLeetCode);
    });
  });
}

function showNotLeetCodeMessage() {
  notLeetcode.classList.remove('hidden');
  chatContainer.classList.add('hidden');
  inputArea.classList.add('hidden');
  statusBar.classList.add('hidden');
}

// ============================================
// Authentication (Firebase via Backend)
// ============================================

async function checkAuthState() {
  try {
    const result = await chrome.storage.local.get(['user', 'authToken']);
    if (result.user && result.authToken) {
      currentUser = result.user;
      updateUIForLoggedInUser();
    }
  } catch (error) {
    console.error('Error checking auth state:', error);
  }
}

function updateUIForLoggedInUser() {
  loginBtn.classList.add('hidden');
  userInfo.classList.remove('hidden');
  if (currentUser.photoURL) {
    userAvatar.src = currentUser.photoURL;
  } else {
    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=ffa116&color=fff`;
  }
  saveStatus.textContent = 'Logged in - hints will be saved';
}

function updateUIForLoggedOutUser() {
  loginBtn.classList.remove('hidden');
  userInfo.classList.add('hidden');
  currentUser = null;
  saveStatus.textContent = 'Not logged in';
}

// Login with Google (opens new tab for Firebase auth)
// The background.js handles the auth callback and saves the token to storage
loginBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:9002/login?extension=true' });
});

// Listen for auth changes saved by background.js
// Updates popup UI if it happens to still be open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.authToken && changes.authToken.newValue) {
    const user = changes.user?.newValue;
    if (user) {
      currentUser = user;
      updateUIForLoggedInUser();
    }
  }
});

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['user', 'authToken']);
  updateUIForLoggedOutUser();
});

// ============================================
// Problem Data Fetching
// ============================================

async function fetchProblemData() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        reject(new Error('No active tab'));
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_HINT_DATA' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error('No response from content script'));
          return;
        }

        resolve(response);
      });
    });
  });
}

// ============================================
// Hint Fetching
// ============================================

async function fetchInitialHint() {
  setLoading(true);
  addLoadingMessage();

  try {
    // Fetch problem data from LeetCode page
    const problemData = await fetchProblemData();
    currentProblem = problemData;

    // Call backend API
    const hint = await callBackendAPI({
      title: problemData.title,
      description: problemData.description,
      user_code: problemData.solution
    });

    // Remove loading message
    removeLoadingMessage();

    // Add mentor response
    addMessage('mentor', hint.hint);

    // Store conversation
    conversationHistory.push({
      role: 'assistant',
      content: hint.hint
    });

    // Store problem ID if returned
    if (hint.problem_id) {
      currentProblemId = hint.problem_id;
      saveStatus.textContent = 'Saved to dashboard';
    }

    setStatus('Ready');
  } catch (error) {
    removeLoadingMessage();
    addMessage('mentor', `Error: ${error.message}\n\nMake sure you're on a LeetCode problem page and the backend server is running.`);
    setStatus('Error', true);
  }

  setLoading(false);
}

async function sendFollowUpQuestion() {
  const question = questionInput.value.trim();
  if (!question || isLoading || !currentProblem) return;

  // Clear input
  questionInput.value = '';

  // Add user message
  addMessage('user', question);
  conversationHistory.push({ role: 'user', content: question });

  setLoading(true);
  addLoadingMessage();

  try {
    const hint = await callBackendAPI({
      title: currentProblem.title,
      description: currentProblem.description,
      user_code: currentProblem.solution,
      follow_up_question: question,
      conversation_history: conversationHistory
    });

    removeLoadingMessage();
    addMessage('mentor', hint.hint);

    conversationHistory.push({
      role: 'assistant',
      content: hint.hint
    });

    // Update existing problem if logged in
    if (currentProblemId && currentUser) {
      await updateProblemHint(hint.hint);
    }

    setStatus('Ready');
  } catch (error) {
    removeLoadingMessage();
    addMessage('mentor', `Error: ${error.message}`);
    setStatus('Error', true);
  }

  setLoading(false);
}

// ============================================
// Backend API Calls
// ============================================

async function callBackendAPI(data) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add auth token if logged in
  const storage = await chrome.storage.local.get(['authToken']);
  if (storage.authToken) {
    headers['Authorization'] = `Bearer ${storage.authToken}`;
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}/hint/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get hint');
  }

  return response.json();
}

async function updateProblemHint(hint) {
  try {
    const storage = await chrome.storage.local.get(['authToken']);
    if (!storage.authToken || !currentProblemId) return;

    await fetch(`${CONFIG.API_BASE_URL}/problems/${currentProblemId}/hint/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.authToken}`
      },
      body: JSON.stringify({ hint })
    });

    saveStatus.textContent = 'Updated';
  } catch (error) {
    console.error('Error updating problem hint:', error);
  }
}

// ============================================
// UI Helpers
// ============================================

function addMessage(type, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  const label = type === 'user' ? 'You' : 'Mentor';

  messageDiv.innerHTML = `
    <span class="message-label">${label}</span>
    <div class="message-content">${escapeHtml(content)}</div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message mentor loading-message';
  messageDiv.id = 'loadingMessage';

  messageDiv.innerHTML = `
    <span class="message-label">Mentor</span>
    <div class="message-content">
      <div class="loader"></div>
      <span>Analyzing your code...</span>
    </div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingMessage() {
  const loadingMessage = document.getElementById('loadingMessage');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

function setLoading(loading) {
  isLoading = loading;
  questionInput.disabled = loading;
  sendButton.disabled = loading;

  if (loading) {
    setStatus('Thinking...', false);
  }
}

function setStatus(text, isError = false) {
  statusText.textContent = text;
  statusDot.classList.toggle('offline', isError);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// Event Listeners
// ============================================

sendButton.addEventListener('click', sendFollowUpQuestion);

questionInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendFollowUpQuestion();
  }
});
