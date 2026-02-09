// LeetCode Helper - Background Service Worker

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('LeetCode Helper installed!');
  } else if (details.reason === 'update') {
    console.log('LeetCode Helper updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for auth callback from the login page
// This MUST be in background.js because popup.js closes when the user switches tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes('auth-callback')) {
    try {
      const url = new URL(changeInfo.url);
      const token = url.searchParams.get('token');
      const userData = url.searchParams.get('user');

      if (token && userData) {
        const user = JSON.parse(decodeURIComponent(userData));
        chrome.storage.local.set({ user, authToken: token }, () => {
          console.log('Auth saved successfully for:', user.displayName);
        });

        // Close the auth tab after a short delay so user sees the success message
        setTimeout(() => chrome.tabs.remove(tabId), 1500);
      }
    } catch (e) {
      console.error('Error processing auth callback:', e);
    }
  }
});
