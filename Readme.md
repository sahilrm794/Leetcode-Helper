# 🧠 LeetCode Helper – AI Coding Mentor

LeetCode Helper is a Chrome extension + Django backend that gives real-time, AI-powered feedback on your LeetCode submissions — just like a mentor.

It analyzes your code using Gemini or GPT and provides helpful hints, detects bugs, and suggests improvements without revealing full solutions.

---

## 🚀 Features

- 🧩 Chrome extension that integrates directly into LeetCode
- 🤖 AI-powered feedback using Gemini or GPT-4
- 🔐 Django REST API with JWT authentication
- 💾 Feedback history stored per user
- ✨ Clean, minimal UI with helpful tips

---

## 🧱 Tech Stack

### 🧩 Chrome Extension (Frontend)
- JavaScript (or React)
- Manifest V3
- `chrome.storage` for JWT token handling
- DOM parsing of LeetCode code editor

### 🔧 Backend (Django)
- Django & Django REST Framework
- JWT authentication (`djangorestframework-simplejwt`)
- Gemini or OpenAI API for feedback
- SQLite

---

## 📁 Project Structure

```
leetcode-helper/
├── backend/
│   ├── manage.py
│   └── leetcode_helper/
│       ├── settings.py
│       └── ...
├── extension/
│   ├── manifest.json
│   ├── content.js
│   └── ...
├── .env
├── .gitignore
└── README.md
```

---

## 🛠️ Getting Started

### Backend Setup
```bash
cd backend/
python -m venv venv
source venv/bin/activate        # Or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations and start server
python manage.py migrate
python manage.py runserver
```

### Chrome Extension Setup
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. Open LeetCode — the extension auto-injects

---

## 🔐 .env Format (Backend)

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
AI_API_KEY=your-gemini-or-gpt-key
```

> Add `.env` to your `.gitignore` to avoid exposing secrets

---

## 📦 Example Prompt Sent to AI

```text
You're an AI coding mentor. Analyze the code for "Two Sum" and give feedback without solving it. 
Code:
def twoSum(nums, target):
    ...
```

---

## ✅ TODO

- [ ] Add login/logout with Google OAuth
- [ ] Add frontend popup UI to Chrome extension
- [ ] Add multi-platform support (e.g., Codeforces, GFG)
- [ ] Track submission success vs AI suggestions

---

## 📜 License

MIT License © 2025 [Sahil Rajesh Mustilwar]
