function getProblemDescription() {
  const descElem = document.querySelector('div.elfjS[data-track-load="description_content"]');
  return descElem ? descElem.innerText.trim() : 'No description found';
}

function getProblemTitle() {
  const titleAnchor = document.querySelector('div.text-title-large a[href^="/problems/"]');
  if (!titleAnchor) return 'Unknown Problem';

  const fullTitle = titleAnchor.innerText.trim(); // e.g., "12. Integer to Roman"
  const parts = fullTitle.split('. ');
  return parts.length > 1 ? parts.slice(1).join('. ') : fullTitle; // "Integer to Roman"
}

function getLeetCodeSolution() {
  const lines = document.querySelectorAll('.view-line');
  if (!lines || lines.length === 0) return null;

  const code = Array.from(lines).map(line => {
    const spans = line.querySelectorAll('span');
    return Array.from(spans)
      .map(span => span.textContent)
      .join('');
  }).join('\n');

  return code.trim();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_HINT_DATA') {
    const title = getProblemTitle();
    const solution = getLeetCodeSolution();
    const description = getProblemDescription();

    sendResponse({ title, solution, description });
  }
})