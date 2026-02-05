// LeetCode Helper - Content Script
// Runs only on leetcode.com/problems/* pages

function getProblemDescription() {
  // Try multiple selectors as LeetCode may change their DOM
  const selectors = [
    'div.elfjS[data-track-load="description_content"]',
    'div[data-track-load="description_content"]',
    '.question-content',
    '[data-key="description-content"]'
  ];

  for (const selector of selectors) {
    const elem = document.querySelector(selector);
    if (elem) {
      return elem.innerText.trim();
    }
  }

  return 'No description found';
}

function getProblemTitle() {
  // Try multiple selectors for title
  const selectors = [
    'div.text-title-large a[href^="/problems/"]',
    'a[href^="/problems/"][class*="title"]',
    '[data-cy="question-title"]',
    'div[class*="title"] a[href^="/problems/"]'
  ];

  for (const selector of selectors) {
    const elem = document.querySelector(selector);
    if (elem) {
      const fullTitle = elem.innerText.trim();
      // Remove problem number if present (e.g., "12. Integer to Roman" -> "Integer to Roman")
      const parts = fullTitle.split('. ');
      return parts.length > 1 ? parts.slice(1).join('. ') : fullTitle;
    }
  }

  // Fallback: try to get from page title
  const pageTitle = document.title;
  if (pageTitle.includes(' - LeetCode')) {
    return pageTitle.replace(' - LeetCode', '').trim();
  }

  return 'Unknown Problem';
}

function getLeetCodeSolution() {
  // Monaco editor view lines
  const lines = document.querySelectorAll('.view-line');

  if (!lines || lines.length === 0) {
    // Try alternative selector
    const codeArea = document.querySelector('.monaco-editor .view-lines');
    if (codeArea) {
      return codeArea.innerText.trim();
    }
    return '// No code found - please write some code first';
  }

  const code = Array.from(lines).map(line => {
    const spans = line.querySelectorAll('span');
    return Array.from(spans)
      .map(span => span.textContent)
      .join('');
  }).join('\n');

  return code.trim() || '// No code found - please write some code first';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_HINT_DATA') {
    const title = getProblemTitle();
    const solution = getLeetCodeSolution();
    const description = getProblemDescription();

    sendResponse({ title, solution, description });
  }

  // Return true to indicate we will send a response asynchronously
  return true;
});

// Log when content script loads (for debugging)
console.log('LeetCode Helper content script loaded');
