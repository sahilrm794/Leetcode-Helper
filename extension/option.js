document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const saveBtn = document.querySelector('.btn-save');
  const successMsg = document.getElementById('success-msg');

  // Load saved API key on page load
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save API key
  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();

    if (!key) {
      successMsg.textContent = '❌ Please enter a valid API key.';
      successMsg.style.color = '#ff6b6b';
      successMsg.style.display = 'block';
      return;
    }

    chrome.storage.sync.set({ geminiApiKey: key }, () => {
      successMsg.textContent = '✅ API Key saved successfully!';
      successMsg.style.color = '#66d9ef';
      successMsg.style.display = 'block';

      // Hide after 3 seconds
      setTimeout(() => {
        successMsg.style.display = 'none';
      }, 3000);
    });
  });
});
