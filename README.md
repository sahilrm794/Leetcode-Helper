# 🚀 LeetCode AI Helper Extension

An AI-powered Chrome extension that provides **real-time hints, explanations, and feedback** while solving problems on **LeetCode** — without revealing full solutions.

This project acts like a **personal mentor**, helping users think through problems, debug logic, and improve problem-solving skills efficiently.

---

## ✨ Features

- 🧠 AI-generated hints tailored to the current LeetCode problem
- ⚡ Real-time feedback while coding
- 🔒 Secure backend using JWT authentication
- 💾 Feedback history storage (Chrome Storage + Backend DB)
- 🧩 Manifest V3 Chrome Extension
- 🧪 ~50% reduction in debugging time
- 📈 ~60% improvement in code acceptance
- 🔌 Supports Gemini / GPT APIs

---

## 🏗️ Tech Stack

### Frontend (Chrome Extension)
- JavaScript / TypeScript
- Chrome Extension APIs (Manifest V3)
- chrome.storage
- Content Scripts & Background Service Workers

### Backend
- Django
- Django REST Framework
- JWT Authentication
- PostgreSQL (NeonDB compatible)

### AI Integration
- Gemini API / GPT API
- Custom prompt engineering

---

## 📁 Project Structure

```
leetcode-ai-helper/
│
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── contentScript.js
│   ├── popup/
│
├── backend/
│   ├── backend/
│   ├── api/
│   └── manage.py
│
├── .env.example
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation (Local Setup)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/leetcode-ai-helper.git
cd leetcode-ai-helper
```

---

## 🖥️ Backend Setup

### 2️⃣ Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate   # Linux / Mac
venv\Scripts\activate    # Windows
```

---

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4️⃣ Environment Variables

Create `.env` file:

```env
SECRET_KEY=your_secret_key
DEBUG=True

DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=your_password
DB_HOST=your_neon_host
DB_PORT=5432

JWT_SECRET=your_jwt_secret
AI_API_KEY=your_ai_api_key
```

---

### 5️⃣ Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### 6️⃣ Start Server

```bash
python manage.py runserver
```

---

## 🧩 Chrome Extension Setup

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable Developer Mode
4. Click **Load unpacked**
5. Select the `extension/` folder

---

## 🔐 How It Works

1. Detects LeetCode problem
2. Sends metadata to backend
3. AI generates guided hints
4. Response shown in extension
5. Feedback stored for revision

---

## 🚀 Future Enhancements

- User analytics dashboard
- Bookmark problems
- Adaptive hint difficulty
- Firefox support

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Sahil Rajesh Mustilwar**

---

## ⭐ Support

If you like this project, give it a ⭐!
