// LeetCode Helper - Background Service Worker

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('LeetCode Helper installed!');
  } else if (details.reason === 'update') {
    console.log('LeetCode Helper updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle extension icon click on non-LeetCode pages
chrome.action.onClicked.addListener((tab) => {
  // This won't fire if we have a popup, but keeping for reference
  if (!tab.url.includes('leetcode.com/problems/')) {
    console.log('Not on LeetCode problem page');
  }
});
