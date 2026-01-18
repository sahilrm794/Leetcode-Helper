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
function fetchLeetCodeData() {
  hintBox.innerHTML = '<div class="loading"><div class="loader"></div></div>';
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) =>{
    if (!geminiApiKey) {
      hintBox.innerHTML =
        "API key not found. Please set your API key in the extension options.";
      return;
    }
  
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0]) return;

    chrome.tabs.sendMessage(
      tabs[0].id, 
      { type: 'GET_HINT_DATA' },
       async function (response) {
        if (chrome.runtime.lastError || !response) {
          hintBox.textContent = '❌ Failed to fetch problem data.';
          return;
        }

        const { title, description, solution } = response;
      
        try{
          const hint=await getGeminiHint(title,description,solution,geminiApiKey);
          hintBox.textContent=hint;
        }catch(error){
          hintBox.textContent="Gemini error: "+ error.message;
        }
    }
  );
  });
  });
}


//Gemini Function to get hint
async function getGeminiHint(title,description,solution,geminiApiKey) {
  const prompt = `You are an expert competitive programmer and mentor helping students improve their coding skills. A user has written a partial or complete solution to a LeetCode-style problem. Your job is to act like a mentor and give helpful, concise feedback **without giving away the full correct solution unless it is already present**.

    Here is what you need to do:

    1. **Understand the user's intent** from the provided code and explain briefly what their current solution seems to be doing.
    2. **Check the logic** and **suggest whether the user is moving in the right direction** to solve the problem or not.
    3. Look for common mistakes such as:
    - Incorrect or inconsistent **variable names** (e.g., \`arr\` vs \`nums\`, \`n\` misused etc.)
    - Off-by-one errors or **out-of-bound access** in **loop conditions**.
    - Accidental use of \`--\` instead of \`++\`, or vice versa.
    - Any obvious **syntax errors**.
    4. If the code is complete, point out if there are **ways to optimize the time or space complexity**.
    5. If the solution has a bug or won't work in some cases, **explain clearly why it will fail** and give an **example edge case** that would break it (without solving it).
    6. Be supportive and constructive — give **clear hints** or ask **leading questions** that guide the user to the right solution path.
    7. Do **not provide the full solution** unless it is already fully implemented and just needs review.

    Here is the Leetcode Problem:
    ${description}
    Here is the user's code:
    ${solution}
     The response should not be like this
     Okay, here's a concise hint to guide you:

*   **Understanding:** Your current solution uses nested loops to check all possible pairs of numbers in the input array. This will find the correct answer, but it might not be the most efficient approach.

*   **Logic:** The logic is correct. You are checking every possible pair to see if they sum to the target.

*   **Optimization:** Consider using a hash map (or JavaScript object) to store each number and its index as you iterate through the array. This will allow you to check if the complement (target - current number) exists in the array in O(1) time.

*   **Time Complexity:** Think about how using a hash map could reduce the time complexity from O(n^2) to O(n).
It should be like this
Your solution has a time complexity of O(n^2). You can optimize this by using a hash map to store the numbers you've seen and their indices. This will reduce the time complexity to O(n).
  Give a very concised Hint Of 10-15 Lines: 
    Also Just Give hint dont add any line like "Okay, I will give you a concise hint in points to pass on to the user:" because i am going to give the response whatever u will give directly the same response to user.So,it should be like mentor not AI.Also in response refer user as you.Also give the response in points.
     `
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method:"POST",
        headers:{"Content-Type":"application/json" },
        body: JSON.stringify({
          contents:[{ parts: [{text:prompt}]}],
          generationConfig:{temperature:0.4},
        }),
      }
    )
    if(!res.ok){
      const {error}=await res.json();
      throw new Error(error?.message || "Request failed");
    }
    const data=await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text??"No Solution.";
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
