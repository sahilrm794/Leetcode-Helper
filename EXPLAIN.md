# LeetCode Helper - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Backend (Django)](#backend-django)
6. [Extension (Chrome)](#extension-chrome)
7. [Frontend (Next.js)](#frontend-nextjs)
8. [Authentication Flow](#authentication-flow)
9. [Session Management](#session-management)
10. [Data Flow](#data-flow)
11. [API Endpoints](#api-endpoints)
12. [Database Schema](#database-schema)
13. [Setup & Installation](#setup--installation)
14. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Project Overview

**LeetCode Helper** is an AI-powered Chrome extension that provides real-time hints and feedback while solving problems on LeetCode. Unlike other tools that just give you the solution, this acts like a **personal mentor** - it analyzes YOUR code and helps you debug, optimize, and understand your approach without spoiling the solution.

### Key Features
- Smart hints tailored to your current code approach
- Follow-up questions with conversation context
- Progress tracking in a dashboard
- Optional login to save history across devices
- Works only on LeetCode problem pages

### How It's Different
If you're solving a Two Sum problem using a brute-force nested loop approach, this tool won't just tell you "use a hashmap". Instead, it will:
1. Understand that you're trying a O(n²) approach
2. Point out if your logic is correct
3. Suggest ways to optimize YOUR approach
4. Give hints without revealing the full solution

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐         ┌─────────────────────────────────────┐   │
│   │   LeetCode.com      │         │      Chrome Extension               │   │
│   │   /problems/*       │◄───────►│  ┌─────────────┐ ┌──────────────┐  │   │
│   │                     │ scrape  │  │ content.js  │ │   popup.js   │  │   │
│   │   - Problem desc    │  data   │  │ (scraper)   │ │  (UI logic)  │  │   │
│   │   - User's code     │         │  └─────────────┘ └──────────────┘  │   │
│   └─────────────────────┘         │         │              │           │   │
│                                   │         ▼              ▼           │   │
│                                   │    ┌─────────────────────────┐     │   │
│                                   │    │      popup.html         │     │   │
│                                   │    │   (Chat-like UI)        │     │   │
│                                   │    └─────────────────────────┘     │   │
│                                   └─────────────────────────────────────┘   │
│                                                    │                         │
│                                                    │ HTTP Request            │
│                                                    │ (with Firebase token    │
│                                                    │  if logged in)          │
│                                                    ▼                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Next.js Frontend (Dashboard)                      │   │
│   │   localhost:9002                                                     │   │
│   │   - /login (Firebase Google OAuth)                                   │   │
│   │   - /dashboard (View problem history)                                │   │
│   │   - /download (Extension download page)                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                    │                         │
└────────────────────────────────────────────────────┼─────────────────────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DJANGO BACKEND (localhost:8000)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐    │
│   │  Firebase Auth  │    │   API Views     │    │    Groq API         │    │
│   │  Verification   │───►│  /api/hint/     │───►│   (LLaMA 3.3 70B)  │    │
│   │                 │    │  /api/problems/ │    │                     │    │
│   └─────────────────┘    └─────────────────┘    └─────────────────────┘    │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌─────────────────┐                                │
│                          │   SQLite (dev)  │                                │
│                          │   PostgreSQL    │                                │
│                          │   (NeonDB prod) │                                │
│                          │  - Users        │                                │
│                          │  - Problems     │                                │
│                          └─────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Django 5.2** | Web framework |
| **Django REST Framework** | API development |
| **SQLite / PostgreSQL (NeonDB)** | Database (SQLite for dev, NeonDB for prod) |
| **Firebase Admin SDK** | Token verification |
| **python-dotenv** | Environment variables |
| **requests** | HTTP client for Groq API |
| **django-cors-headers** | CORS handling |
| **psycopg2-binary** | PostgreSQL driver (production) |

### Extension
| Technology | Purpose |
|------------|---------|
| **Manifest V3** | Chrome extension standard |
| **Chrome APIs** | tabs, storage, runtime |
| **Vanilla JavaScript** | No framework needed |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components |
| **Firebase Auth** | Google OAuth |
| **TanStack Table** | Data tables |

### External Services
| Service | Purpose |
|---------|---------|
| **Groq** | AI hint generation (LLaMA 3.3 70B via fast inference) |
| **Firebase** | Authentication |
| **NeonDB** | Serverless PostgreSQL (production) |

---

## Project Structure

```
Leetcode-helper/
│
├── backend/                      # Django Backend
│   ├── api/                      # Main API app
│   │   ├── __init__.py
│   │   ├── admin.py              # Django admin config
│   │   ├── apps.py               # App configuration
│   │   ├── authentication.py     # Firebase token verification
│   │   ├── models.py             # Database models
│   │   ├── serializers.py        # DRF serializers
│   │   ├── urls.py               # API routes
│   │   └── views.py              # API logic & Groq integration
│   │
│   ├── backend/                  # Django project settings
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py           # Main configuration
│   │   ├── urls.py               # Root URL config
│   │   └── wsgi.py
│   │
│   ├── firebase-service-account.json  # Firebase credentials
│   ├── .env                      # Environment variables
│   ├── manage.py                 # Django CLI
│   └── requirements.txt          # Python dependencies
│
├── extension/                    # Chrome Extension
│   ├── manifest.json             # Extension configuration
│   ├── popup.html                # Extension popup UI
│   ├── popup.js                  # Popup logic
│   ├── content.js                # LeetCode page scraper
│   ├── background.js             # Service worker
│   ├── config.js                 # Firebase & API config
│   └── icon.png                  # Extension icon
│
├── frontend/
│   └── Leetcode-dashboard/       # Next.js Dashboard
│       ├── src/
│       │   ├── app/              # Next.js App Router pages
│       │   │   ├── page.tsx                    # Home (redirect)
│       │   │   ├── layout.tsx                  # Root layout
│       │   │   ├── login/page.tsx              # Login page
│       │   │   ├── download/page.tsx           # Extension download
│       │   │   ├── auth-callback/page.tsx      # Extension auth callback
│       │   │   └── dashboard/
│       │   │       ├── page.tsx                # Dashboard main
│       │   │       ├── layout.tsx              # Dashboard layout
│       │   │       ├── profile/page.tsx        # User profile
│       │   │       ├── settings/page.tsx       # Settings
│       │   │       └── problems/[id]/page.tsx  # Problem detail
│       │   │
│       │   ├── components/       # React components
│       │   │   ├── ui/           # shadcn/ui components
│       │   │   ├── problems-table.tsx
│       │   │   ├── code-block.tsx
│       │   │   ├── icons.tsx
│       │   │   └── theme-toggle.tsx
│       │   │
│       │   ├── context/
│       │   │   └── AuthContext.tsx  # Auth state management
│       │   │
│       │   └── lib/
│       │       ├── firebase.ts      # Firebase initialization
│       │       ├── api.ts           # Backend API client
│       │       ├── types.ts         # TypeScript types
│       │       ├── data.ts          # Mock data (fallback)
│       │       └── utils.ts         # Utility functions
│       │
│       ├── .env.local            # Frontend env variables
│       ├── package.json
│       ├── next.config.ts
│       └── tailwind.config.ts
│
├── README.md                     # Project readme
└── EXPLAIN.md                    # This file
```

---

## Backend (Django)

### File: `backend/api/models.py`

Defines the database structure.

```python
class Problem(models.Model):
    STATUS_CHOICES = [
        ('Solved', 'Solved'),
        ('Need Revision', 'Need Revision'),
        ('Pending', 'Pending'),
    ]

    user = models.ForeignKey(User, ...)  # Links to Django User
    title = models.CharField(...)         # Problem title (e.g., "Two Sum")
    description = models.TextField()      # Full problem description
    user_code = models.TextField()        # User's submitted code
    ai_hint = models.TextField()          # AI-generated hint
    date = models.DateTimeField()         # When hint was requested
    status = models.CharField(...)        # Solved/Need Revision/Pending
    tags = models.JSONField()             # ["Array", "Hash Table"]
```

---

### File: `backend/api/authentication.py`

Firebase token verification for REST Framework.

```python
class FirebaseAuthentication(BaseAuthentication):
    """
    1. Extracts 'Bearer <token>' from Authorization header
    2. Verifies token with Firebase Admin SDK
    3. Gets/creates Django user from Firebase UID
    4. Returns (user, decoded_token) tuple
    """

    def authenticate(self, request):
        # Get token from header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        token = auth_header.split()[1]  # "Bearer <token>" -> "<token>"

        # Verify with Firebase
        decoded_token = auth.verify_id_token(token)

        # Get or create Django user
        user, created = User.objects.get_or_create(
            username=decoded_token['uid'],
            defaults={'email': decoded_token['email']}
        )

        return (user, decoded_token)
```

---

### File: `backend/api/views.py`

Contains all API logic.

#### Function: `get_hint(request)`
Main endpoint for getting AI hints.

```python
@api_view(['POST'])
@permission_classes([AllowAny])  # Works with or without login
def get_hint(request):
    """
    POST /api/hint/

    Request Body:
    {
        "title": "Two Sum",
        "description": "Given an array...",
        "user_code": "function twoSum...",
        "conversation_history": [...],  # Optional
        "follow_up_question": "..."      # Optional
    }

    Response:
    {
        "hint": "Your solution looks correct but...",
        "problem_id": 123  # Only if logged in
    }
    """
    # 1. Extract data from request
    title = request.data.get('title')
    description = request.data.get('description')
    user_code = request.data.get('user_code')

    # 2. Build prompt for Groq
    prompt = build_mentor_prompt(title, description, user_code, ...)

    # 3. Call Groq API
    hint = call_groq_api(prompt)

    # 4. Save to database if logged in
    if request.user.is_authenticated:
        problem = Problem.objects.create(
            user=request.user,
            title=title,
            ai_hint=hint,
            ...
        )

    return Response({'hint': hint, 'problem_id': problem.id})
```

#### Function: `build_mentor_prompt(...)`
Creates the AI prompt with mentor personality.

```python
def build_mentor_prompt(title, description, user_code, conversation_history, follow_up):
    """
    Builds a detailed prompt that:
    1. Sets AI role as a mentor (not solution giver)
    2. Includes problem description
    3. Includes user's code
    4. Adds conversation history for context
    5. Specifies response format (concise, in points)
    """
    prompt = f"""
    You are an expert competitive programmer and mentor...

    Problem: {title}
    {description}

    User's code:
    {user_code}

    Previous conversation:
    {conversation_history}

    Give hints without revealing the solution...
    """
    return prompt
```

#### Function: `call_groq_api(prompt)`
Makes HTTP request to Groq's OpenAI-compatible API.

```python
def call_groq_api(prompt):
    """
    Calls LLaMA 3.3 70B model via Groq's fast inference API.
    Uses OpenAI-compatible chat completions endpoint.
    Returns the generated text response.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    api_key = os.getenv("GROQ_API_KEY")

    response = requests.post(url, json={
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are an expert competitive programmer and coding mentor."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 1024
    }, headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    })

    return response.json()['choices'][0]['message']['content']
```

---

### File: `backend/api/urls.py`

API route definitions.

```python
urlpatterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view()),

    # Main hint endpoint
    path('hint/', get_hint),

    # Problem CRUD
    path('problems/', ProblemListCreateView.as_view()),
    path('problems/<int:pk>/', ProblemDetailView.as_view()),
    path('problems/<int:pk>/hint/', update_problem_hint),

    # User stats
    path('stats/', get_user_stats),
]
```

---

### File: `backend/backend/settings.py`

Key configuration settings.

```python
# CORS - Allow requests from frontend & extension
CORS_ALLOW_ALL_ORIGINS = True  # In development
CORS_ALLOW_CREDENTIALS = True

# REST Framework - Use Firebase auth
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'api.authentication.FirebaseAuthentication',
    ),
}

# Database - SQLite (dev) or PostgreSQL (prod via DATABASE_URL)
if DATABASE_URL:
    DATABASES = {...}  # PostgreSQL config (NeonDB)
else:
    DATABASES = {...}  # SQLite fallback for local dev

# Custom settings
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
```

---

## Extension (Chrome)

### File: `extension/manifest.json`

Extension configuration and permissions.

```json
{
    "manifest_version": 3,
    "name": "LeetCode Helper",
    "version": "2.0",

    "permissions": [
        "activeTab",    // Access current tab
        "storage",      // Store user data
        "identity"      // OAuth (future)
    ],

    "content_scripts": [{
        "matches": [
            "https://leetcode.com/problems/*"  // ONLY LeetCode problems
        ],
        "js": ["content.js"]
    }],

    "action": {
        "default_popup": "popup.html"
    },

    "host_permissions": [
        "https://leetcode.com/*",
        "http://localhost:8000/*"  // Backend API
    ]
}
```

---

### File: `extension/content.js`

Scrapes data from LeetCode page. Runs only on `leetcode.com/problems/*`.

```javascript
// Function: getProblemTitle()
// Extracts problem title from page
function getProblemTitle() {
    // Try multiple selectors (LeetCode changes their DOM)
    const selectors = [
        'div.text-title-large a[href^="/problems/"]',
        '[data-cy="question-title"]',
        // ... more fallbacks
    ];

    for (const selector of selectors) {
        const elem = document.querySelector(selector);
        if (elem) {
            // "12. Integer to Roman" -> "Integer to Roman"
            return elem.innerText.split('. ').slice(1).join('. ');
        }
    }
    return 'Unknown Problem';
}

// Function: getProblemDescription()
// Extracts full problem description
function getProblemDescription() {
    const elem = document.querySelector('div.elfjS[data-track-load="description_content"]');
    return elem ? elem.innerText.trim() : 'No description found';
}

// Function: getLeetCodeSolution()
// Extracts user's code from Monaco editor
function getLeetCodeSolution() {
    const lines = document.querySelectorAll('.view-line');
    const code = Array.from(lines).map(line => {
        const spans = line.querySelectorAll('span');
        return Array.from(spans).map(s => s.textContent).join('');
    }).join('\n');
    return code.trim();
}

// Message listener - responds to popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_HINT_DATA') {
        sendResponse({
            title: getProblemTitle(),
            description: getProblemDescription(),
            solution: getLeetCodeSolution()
        });
    }
    return true;  // Keep channel open for async response
});
```

---

### File: `extension/popup.js`

Main popup logic - handles UI, API calls, and state.

```javascript
// ================== STATE ==================
let currentUser = null;           // Firebase user object
let currentProblem = null;        // Current problem data
let conversationHistory = [];     // Chat history for context
let currentProblemId = null;      // Backend problem ID
let isLoading = false;

// ================== INITIALIZATION ==================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if user is logged in
    await checkAuthState();

    // 2. Check if on LeetCode problem page
    const isOnLeetCode = await checkIfOnLeetCode();
    if (!isOnLeetCode) {
        showNotLeetCodeMessage();  // Show "Navigate to LeetCode" message
        return;
    }

    // 3. Fetch initial hint
    await fetchInitialHint();
});

// ================== LEETCODE CHECK ==================
async function checkIfOnLeetCode() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const url = tabs[0]?.url || '';
            resolve(url.includes('leetcode.com/problems/'));
        });
    });
}

// ================== AUTH ==================
async function checkAuthState() {
    // Check chrome.storage for saved user & token
    const result = await chrome.storage.local.get(['user', 'authToken']);
    if (result.user && result.authToken) {
        currentUser = result.user;
        updateUIForLoggedInUser();
    }
}

// Login button opens dashboard login page
// Auth callback is handled by background.js (not popup.js)
// because the popup closes when the browser switches tabs
loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:9002/login?extension=true' });
});

// Listen for auth changes saved by background.js
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.authToken && changes.authToken.newValue) {
        currentUser = changes.user?.newValue;
        updateUIForLoggedInUser();
    }
});

// ================== HINT FETCHING ==================
async function fetchInitialHint() {
    setLoading(true);
    addLoadingMessage();

    try {
        // 1. Get problem data from content script
        const problemData = await fetchProblemData();
        currentProblem = problemData;

        // 2. Call backend API
        const hint = await callBackendAPI({
            title: problemData.title,
            description: problemData.description,
            user_code: problemData.solution
        });

        // 3. Display hint
        addMessage('mentor', hint.hint);

        // 4. Save to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: hint.hint
        });

        // 5. Save problem ID if returned (user is logged in)
        if (hint.problem_id) {
            currentProblemId = hint.problem_id;
        }
    } catch (error) {
        addMessage('mentor', `Error: ${error.message}`);
    }

    setLoading(false);
}

// ================== FOLLOW-UP QUESTIONS ==================
async function sendFollowUpQuestion() {
    const question = questionInput.value.trim();
    if (!question || isLoading) return;

    // Add user message to UI
    addMessage('user', question);
    conversationHistory.push({ role: 'user', content: question });

    // Call API with conversation history for context
    const hint = await callBackendAPI({
        title: currentProblem.title,
        description: currentProblem.description,
        user_code: currentProblem.solution,
        follow_up_question: question,
        conversation_history: conversationHistory  // Context!
    });

    addMessage('mentor', hint.hint);
    conversationHistory.push({ role: 'assistant', content: hint.hint });
}

// ================== API CALLS ==================
async function callBackendAPI(data) {
    const headers = { 'Content-Type': 'application/json' };

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

    return response.json();
}
```

---

### File: `extension/config.js`

Configuration constants.

```javascript
const CONFIG = {
    // Backend API URL
    API_BASE_URL: 'http://localhost:8000/api',

    // Firebase config (for future direct auth)
    FIREBASE: {
        apiKey: "AIzaSy...",
        authDomain: "leetcode-helper-xxx.firebaseapp.com",
        projectId: "leetcode-helper-xxx",
        // ...
    }
};
```

---

## Frontend (Next.js)

### File: `src/lib/firebase.ts`

Firebase initialization and auth functions.

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    // ...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign in with Google popup
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
}

// Sign out
export async function logOut() {
    await signOut(auth);
}

// Get current user's ID token
export async function getIdToken() {
    return auth.currentUser?.getIdToken();
}

// Subscribe to auth state changes
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}
```

---

### File: `src/context/AuthContext.tsx`

React context for auth state management.

```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to Firebase auth state
        const unsubscribe = onAuthChange((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        const result = await signInWithGoogle();
        setUser(result.user);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook for components to use
export function useAuth() {
    return useContext(AuthContext);
}
```

---

### File: `src/lib/api.ts`

Backend API client functions.

```typescript
const API_BASE_URL = 'http://localhost:8000/api';

// Helper: fetch with auth token
async function fetchWithAuth(url, options = {}) {
    const token = await getIdToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
}

// Get all problems for current user
export async function getProblems(): Promise<Problem[]> {
    const response = await fetchWithAuth('/problems/');
    return response.json();
}

// Get single problem
export async function getProblem(id: string): Promise<Problem> {
    const response = await fetchWithAuth(`/problems/${id}/`);
    return response.json();
}

// Get user statistics
export async function getUserStats() {
    const response = await fetchWithAuth('/stats/');
    return response.json();
}
```

---

### File: `src/app/login/page.tsx`

Login page with Firebase Google OAuth.

```typescript
export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, signIn, getToken } = useAuth();

    const isExtensionAuth = searchParams.get('extension') === 'true';

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user && !isExtensionAuth) {
            router.push('/dashboard');
        }
    }, [user]);

    // Handle extension auth callback
    useEffect(() => {
        if (user && isExtensionAuth) {
            const token = await getToken();
            const userData = { uid: user.uid, email: user.email, ... };

            // Redirect to callback page with token in URL
            router.push(`/auth-callback?token=${token}&user=${JSON.stringify(userData)}`);
        }
    }, [user, isExtensionAuth]);

    return (
        <Button onClick={signIn}>
            Sign in with Google
        </Button>
    );
}
```

---

### File: `src/app/dashboard/page.tsx`

Main dashboard showing user's problems.

```typescript
export default function DashboardPage() {
    const { user } = useAuth();
    const [problems, setProblems] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user) {
            // Fetch problems and stats from backend
            Promise.all([
                getProblems(),
                getUserStats()
            ]).then(([problems, stats]) => {
                setProblems(problems);
                setStats(stats);
            });
        }
    }, [user]);

    return (
        <div>
            {/* Stats cards */}
            <StatsCard title="Total" value={stats?.total_problems} />
            <StatsCard title="Solved" value={stats?.solved} />

            {/* Problems table */}
            <ProblemsTable data={problems} />
        </div>
    );
}
```

---

## Authentication Flow

### Flow 1: Extension Login

```
1. User clicks "Sign in" in extension popup
         │
         ▼
2. Extension opens dashboard login page in new tab
   URL: http://localhost:9002/login?extension=true
   (popup closes automatically when tab switches)
         │
         ▼
3. User clicks "Sign in with Google" on dashboard
         │
         ▼
4. Firebase popup appears, user selects Google account
         │
         ▼
5. Firebase returns user object + ID token
         │
         ▼
6. Dashboard redirects to /auth-callback with token in URL
   URL: /auth-callback?token=xxx&user={...}
         │
         ▼
7. background.js (service worker) is listening for URL changes
   (NOT popup.js - popup closed when tab switched!)
         │
         ▼
8. background.js extracts token and user data from URL
         │
         ▼
9. background.js saves to chrome.storage.local
         │
         ▼
10. background.js closes the auth tab after 1.5s
          │
          ▼
11. Next time user opens popup, checkAuthState() finds the token
    User is now logged in! Token is sent with API requests.
```

**Why background.js?** Chrome extension popups close the moment the user
clicks away or switches tabs. Any listeners in popup.js are lost. The
background service worker persists and catches the auth callback.

### Flow 2: Dashboard Login

```
1. User visits http://localhost:9002
         │
         ▼
2. Home page checks auth state, redirects to /login
         │
         ▼
3. User clicks "Sign in with Google"
         │
         ▼
4. Firebase popup, user selects account
         │
         ▼
5. Firebase returns user, AuthContext updates
         │
         ▼
6. Login page detects user, redirects to /dashboard
         │
         ▼
7. Dashboard fetches problems using user's token
```

---

## Session Management

This section explains how user sessions, conversation context, and data persistence work across the application.

### Overview of Session Types

| Session Type | Storage | Lifetime | Purpose |
|--------------|---------|----------|---------|
| **Conversation Memory** | JavaScript variable (RAM) | Until popup closes | Follow-up questions context |
| **Auth Token** | chrome.storage.local | Until logout | API authentication |
| **User Data** | chrome.storage.local | Until logout | Display user info |
| **Problem History** | PostgreSQL Database | Permanent | Dashboard history |

---

### 1. Extension Conversation Session (In-Memory)

The extension maintains conversation context **in memory** while the popup is open.

```javascript
// popup.js - State variables
let conversationHistory = [];  // Stores chat history
let currentProblem = null;     // Current problem data
let currentProblemId = null;   // Backend problem ID
```

#### How It Works:

```
┌─────────────────────────────────────────────────────────────────┐
│                    POPUP OPENED                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User opens popup                                            │
│     └─► conversationHistory = []  (empty)                       │
│                                                                  │
│  2. First hint received from API                                │
│     └─► conversationHistory.push({                              │
│           role: 'assistant',                                    │
│           content: 'Your approach looks correct...'             │
│         })                                                      │
│                                                                  │
│  3. User asks follow-up: "What about edge cases?"               │
│     └─► conversationHistory.push({                              │
│           role: 'user',                                         │
│           content: 'What about edge cases?'                     │
│         })                                                      │
│                                                                  │
│  4. API called with FULL conversation history                   │
│     POST /api/hint/                                             │
│     Body: {                                                     │
│       title: "Two Sum",                                         │
│       description: "...",                                       │
│       user_code: "...",                                         │
│       follow_up_question: "What about edge cases?",             │
│       conversation_history: [                                   │
│         { role: 'assistant', content: '...' },                  │
│         { role: 'user', content: 'What about edge cases?' }     │
│       ]                                                         │
│     }                                                           │
│                                                                  │
│  5. Backend builds prompt with context                          │
│     └─► Groq sees the full conversation                       │
│     └─► Response is contextual                                  │
│                                                                  │
│  6. Response added to history                                   │
│     └─► conversationHistory.push({                              │
│           role: 'assistant',                                    │
│           content: 'Good question! Edge cases include...'       │
│         })                                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User closes popup
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POPUP CLOSED                                  │
├─────────────────────────────────────────────────────────────────┤
│  conversationHistory = LOST (garbage collected)                 │
│  currentProblem = LOST                                          │
│                                                                  │
│  BUT: If user was logged in, hints were saved to database       │
│       User can see them in dashboard                            │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Points:
- **Session = Popup lifetime** - Closes when popup closes
- **Context sent to API** - Each request includes last 5 messages
- **No local persistence** - History is NOT saved to chrome.storage
- **Database persistence** - If logged in, hints ARE saved to PostgreSQL

---

### 1.1 Conversation Context Management (Deep Dive)

This subsection explains **exactly** how conversation context/memory works for follow-up questions.

#### What is "Context"?
Context = The conversation history that allows the AI to understand follow-up questions like:
- "Can you explain that more?"
- "What about the edge case you mentioned?"
- "How would I implement that?"

Without context, the AI wouldn't know what "that" refers to.

#### The Context Data Structure

```javascript
// popup.js - conversationHistory array
let conversationHistory = [
    {
        role: 'assistant',      // AI's response
        content: 'Your solution uses O(n²) time complexity. Consider using a hash map...'
    },
    {
        role: 'user',           // User's follow-up
        content: 'How would I implement the hash map approach?'
    },
    {
        role: 'assistant',
        content: 'You can create an object to store values as keys and indices as values...'
    },
    {
        role: 'user',
        content: 'What about duplicate values?'
    },
    {
        role: 'assistant',
        content: 'Good question! For duplicates, you need to decide...'
    }
];
```

#### Context Lifecycle - All 8 Points

| # | Event | What Happens | Context State |
|---|-------|--------------|---------------|
| 1 | **Popup Opens** | `conversationHistory = []` initialized | Empty array |
| 2 | **Initial Hint Received** | First AI response pushed to array | 1 message |
| 3 | **User Asks Follow-up** | User question pushed, then sent to API | 2 messages |
| 4 | **Follow-up Response** | AI response pushed to array | 3 messages |
| 5 | **Multiple Follow-ups** | Array keeps growing | N messages |
| 6 | **API Request** | Only last 5 messages sent (to limit token usage) | Sent: min(N, 5) |
| 7 | **Popup Closes** | Array garbage collected, context LOST | Gone |
| 8 | **New Popup Opens** | Fresh start, no memory of previous session | Empty array |

#### How Context is Sent to Backend

```javascript
// popup.js - sendFollowUpQuestion()

async function sendFollowUpQuestion() {
    const question = questionInput.value.trim();

    // 1. Add user's question to local history
    conversationHistory.push({
        role: 'user',
        content: question
    });

    // 2. Send request WITH context (last 5 messages only)
    const response = await callBackendAPI({
        title: currentProblem.title,
        description: currentProblem.description,
        user_code: currentProblem.solution,
        follow_up_question: question,
        conversation_history: conversationHistory.slice(-5)  // <-- CONTEXT!
    });

    // 3. Add AI response to local history
    conversationHistory.push({
        role: 'assistant',
        content: response.hint
    });
}
```

#### How Backend Uses Context

```python
# views.py - build_mentor_prompt()

def build_mentor_prompt(title, description, user_code, conversation_history, follow_up):
    # Base prompt with problem info
    prompt = f"""
    Problem: {title}
    {description}

    User's Code:
    {user_code}
    """

    # ADD CONVERSATION CONTEXT
    if conversation_history and len(conversation_history) > 0:
        prompt += "\n\n**Previous conversation:**\n"

        for msg in conversation_history[-5:]:  # Last 5 messages
            if msg.get('role') == 'user':
                prompt += f"\nUser: {msg.get('content')}\n"
            else:
                prompt += f"\nMentor: {msg.get('content')}\n"

    # ADD CURRENT FOLLOW-UP QUESTION
    if follow_up:
        prompt += f"\n\n**User's current question:** {follow_up}\n"
        prompt += "Answer based on the conversation above."

    return prompt
```

#### Example: Complete Context Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ USER SOLVING: Two Sum                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ [1] User opens popup, initial hint requested                            │
│     API Request: { title, description, user_code }                      │
│     conversationHistory: []                                             │
│                                                                          │
│ [2] AI responds: "Your nested loop approach is O(n²)..."                │
│     conversationHistory: [                                              │
│       { role: 'assistant', content: 'Your nested loop...' }            │
│     ]                                                                   │
│                                                                          │
│ [3] User asks: "How can I optimize it?"                                 │
│     conversationHistory: [                                              │
│       { role: 'assistant', content: 'Your nested loop...' },           │
│       { role: 'user', content: 'How can I optimize it?' }              │
│     ]                                                                   │
│     API Request includes: conversation_history + follow_up_question     │
│                                                                          │
│ [4] AI responds: "Consider using a hash map to store seen values..."    │
│     conversationHistory: [                                              │
│       { role: 'assistant', content: 'Your nested loop...' },           │
│       { role: 'user', content: 'How can I optimize it?' },             │
│       { role: 'assistant', content: 'Consider using a hash map...' }   │
│     ]                                                                   │
│                                                                          │
│ [5] User asks: "Can you show me a hint for the hash map logic?"         │
│     API receives FULL context, understands what "hash map" refers to    │
│                                                                          │
│ [6] User closes popup                                                    │
│     conversationHistory = GARBAGE COLLECTED                             │
│     Context is LOST forever (unless saved to database)                  │
│                                                                          │
│ [7] User reopens popup                                                   │
│     conversationHistory = [] (fresh start)                              │
│     No memory of previous conversation                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Why Only Last 5 Messages?

```javascript
conversation_history: conversationHistory.slice(-5)
```

| Reason | Explanation |
|--------|-------------|
| **Token Limits** | Groq API has input token limits; too much context = slower responses |
| **Cost** | More tokens = more API cost |
| **Relevance** | Recent messages are more relevant than old ones |
| **Performance** | Smaller payload = faster API response |

#### What Gets Saved vs. What Gets Lost

| Data | Saved to Database? | Persists After Popup Close? |
|------|-------------------|----------------------------|
| Initial hint | Yes (if logged in) | Yes |
| Follow-up hints | Appended to problem.ai_hint | Yes |
| Conversation structure | No | No |
| Message timestamps | No | No |
| Full chat history | No | No |

#### Why Context is NOT Persisted Locally

Design decision reasons:
1. **Privacy** - Users may not want conversation history stored
2. **Simplicity** - No need to manage local storage cleanup
3. **Fresh Start** - Each session starts clean, no stale context
4. **Database Backup** - Important hints ARE saved to PostgreSQL

#### Future Enhancement: Persistent Context

To persist context across popup sessions:

```javascript
// Save context when popup closes
window.addEventListener('beforeunload', () => {
    chrome.storage.local.set({
        [`context_${currentProblem.title}`]: conversationHistory
    });
});

// Load context when popup opens
const savedContext = await chrome.storage.local.get(`context_${title}`);
if (savedContext) {
    conversationHistory = savedContext;
}
```

---

### 2. Authentication Session (Persistent Storage)

Auth data persists in `chrome.storage.local` until explicit logout.

```javascript
// Stored in chrome.storage.local
{
    "user": {
        "uid": "firebase-uid-123",
        "email": "user@example.com",
        "displayName": "John Doe",
        "photoURL": "https://..."
    },
    "authToken": "eyJhbGciOiJSUzI1NiIs..."  // Firebase ID token
}
```

#### Storage Lifecycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Sign in" in extension                          │
│                                                                  │
│  2. Dashboard opens, Firebase auth completes                    │
│                                                                  │
│  3. Extension receives token via URL callback                   │
│     /auth-callback?token=xxx&user={...}                         │
│                                                                  │
│  4. Extension saves to storage:                                 │
│     chrome.storage.local.set({                                  │
│       user: { uid, email, displayName, photoURL },              │
│       authToken: "eyJhbG..."                                    │
│     });                                                         │
│                                                                  │
│  5. Token persists across:                                      │
│     ✓ Popup open/close                                          │
│     ✓ Browser restart                                           │
│     ✓ Computer restart                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      USING THE SESSION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Every API request:                                             │
│                                                                  │
│  1. popup.js checks storage                                     │
│     const { authToken } = await chrome.storage.local.get();     │
│                                                                  │
│  2. If token exists, add to request                             │
│     headers['Authorization'] = `Bearer ${authToken}`;           │
│                                                                  │
│  3. Backend verifies token with Firebase Admin SDK              │
│     decoded = auth.verify_id_token(token)                       │
│                                                                  │
│  4. If valid, request is authenticated                          │
│     └─► Problems saved to user's account                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      LOGOUT FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Logout" in extension                           │
│                                                                  │
│  2. Storage cleared:                                            │
│     chrome.storage.local.remove(['user', 'authToken']);         │
│                                                                  │
│  3. UI updates to show login button                             │
│                                                                  │
│  4. Extension still works, but hints not saved                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Token Expiration & Refresh

Firebase ID tokens expire after **1 hour**. Here's how it's handled:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Token Created ──────────────────────────────────► Token Expires │
│       │                  1 HOUR                          │       │
│       │                                                  │       │
│       ▼                                                  ▼       │
│  ┌─────────┐                                      ┌──────────┐  │
│  │ Valid   │                                      │ Expired  │  │
│  │ Token   │                                      │ Token    │  │
│  └─────────┘                                      └──────────┘  │
│       │                                                  │       │
│       │ API Request                                      │       │
│       ▼                                                  ▼       │
│  ┌─────────────┐                              ┌──────────────┐  │
│  │ Backend     │                              │ Backend      │  │
│  │ Accepts     │                              │ Rejects      │  │
│  │ Request     │                              │ 401 Error    │  │
│  └─────────────┘                              └──────────────┘  │
│                                                      │           │
│                                                      ▼           │
│                                              ┌──────────────┐   │
│                                              │ User needs   │   │
│                                              │ to re-login  │   │
│                                              └──────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Current Implementation:** User must re-login when token expires.

**Future Enhancement:** Auto-refresh token using Firebase's `onIdTokenChanged`.

---

### 4. Frontend Session (Next.js)

The dashboard uses React Context for session state.

```typescript
// AuthContext.tsx

// State stored in React Context (RAM)
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

// Firebase handles token persistence automatically
useEffect(() => {
    // Firebase SDK maintains its own session
    // Tokens stored in IndexedDB by Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
    });
    return () => unsubscribe();
}, []);
```

#### Frontend Session Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                   BROWSER TAB OPENED                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. App loads, AuthProvider initializes                         │
│     └─► loading = true, user = null                             │
│                                                                  │
│  2. Firebase SDK checks IndexedDB for existing session          │
│     └─► Firebase maintains its own persistent storage           │
│                                                                  │
│  3. If session exists:                                          │
│     └─► onAuthStateChanged fires with user object               │
│     └─► setUser(user), setLoading(false)                        │
│     └─► User is automatically logged in!                        │
│                                                                  │
│  4. If no session:                                              │
│     └─► onAuthStateChanged fires with null                      │
│     └─► setUser(null), setLoading(false)                        │
│     └─► Redirect to /login                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Backend Session Handling

Django REST Framework is **stateless** - no server-side sessions.

```python
# Every request is independent
# Authentication happens on EVERY request

class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # 1. Get token from header
        token = request.META.get('HTTP_AUTHORIZATION')

        # 2. Verify with Firebase (external service)
        decoded = auth.verify_id_token(token)

        # 3. Get/create user
        user = User.objects.get_or_create(username=decoded['uid'])

        # 4. Return user for this request only
        return (user, decoded)
```

#### Why Stateless?
- **Scalability** - Any server can handle any request
- **Simplicity** - No session storage needed
- **Security** - Token verified every time
- **RESTful** - True REST APIs are stateless

---

### 6. Session Data Summary

| Data | Where Stored | Lifetime | Survives Restart |
|------|--------------|----------|------------------|
| Conversation history | popup.js variable | Popup open | No |
| Current problem | popup.js variable | Popup open | No |
| Auth token (extension) | chrome.storage.local | Until logout | Yes |
| User info (extension) | chrome.storage.local | Until logout | Yes |
| Auth token (frontend) | Firebase IndexedDB | Until logout | Yes |
| Problem history | PostgreSQL | Forever | Yes |
| User account | PostgreSQL | Forever | Yes |

---

### 7. Code Examples

#### Saving to Session (Extension)
```javascript
// Save auth data
chrome.storage.local.set({
    user: { uid, email, displayName, photoURL },
    authToken: token
});

// Read auth data
const { user, authToken } = await chrome.storage.local.get(['user', 'authToken']);

// Clear auth data (logout)
await chrome.storage.local.remove(['user', 'authToken']);
```

#### Building Context for Follow-up
```javascript
// popup.js
let conversationHistory = [];

// After getting initial hint
conversationHistory.push({
    role: 'assistant',
    content: hintText
});

// When user asks follow-up
conversationHistory.push({
    role: 'user',
    content: userQuestion
});

// Send with request (last 5 messages for context)
const response = await callBackendAPI({
    ...problemData,
    follow_up_question: userQuestion,
    conversation_history: conversationHistory.slice(-5)
});
```

#### Backend Using Context
```python
# views.py
def build_mentor_prompt(title, description, user_code, conversation_history, follow_up):
    prompt = f"Problem: {title}\n{description}\n\nCode:\n{user_code}"

    # Add conversation context
    if conversation_history:
        prompt += "\n\nPrevious conversation:\n"
        for msg in conversation_history[-5:]:
            role = "User" if msg['role'] == 'user' else "Mentor"
            prompt += f"{role}: {msg['content']}\n"

    if follow_up:
        prompt += f"\n\nFollow-up question: {follow_up}"

    return prompt
```

---

## Data Flow

### Getting a Hint (Complete Flow)

```
1. User is on leetcode.com/problems/two-sum
         │
         ▼
2. User writes some code in LeetCode editor
         │
         ▼
3. User clicks extension icon
         │
         ▼
4. popup.js initializes:
   - Checks if on LeetCode ✓
   - Checks auth state
         │
         ▼
5. popup.js sends message to content.js:
   { type: 'GET_HINT_DATA' }
         │
         ▼
6. content.js scrapes LeetCode page:
   - Title: "Two Sum"
   - Description: "Given an array..."
   - User's code: "function twoSum..."
         │
         ▼
7. content.js sends response back to popup.js
         │
         ▼
8. popup.js calls backend API:
   POST http://localhost:8000/api/hint/
   Headers: { Authorization: 'Bearer <token>' }  // if logged in
   Body: { title, description, user_code }
         │
         ▼
9. Backend receives request:
   - authentication.py verifies token (if present)
   - views.py extracts data
         │
         ▼
10. Backend builds prompt:
    "You are a mentor... Problem: Two Sum...
     User's code: function twoSum..."
         │
         ▼
11. Backend calls Groq API:
    POST https://api.groq.com/openai/v1/chat/completions
    Model: llama-3.3-70b-versatile
         │
         ▼
12. Groq returns hint text (via LLaMA 3.3 70B)
         │
         ▼
13. Backend saves to database (if user authenticated):
    Problem.objects.create(user=user, title=..., ai_hint=hint)
         │
         ▼
14. Backend returns response:
    { hint: "Your approach is...", problem_id: 123 }
         │
         ▼
15. popup.js receives response:
    - Displays hint in chat UI
    - Saves to conversationHistory for context
    - Updates status ("Saved to dashboard")
         │
         ▼
16. User can now ask follow-up questions!
```

---

## API Endpoints

### `POST /api/hint/`
Get AI hint for a problem.

**Request:**
```json
{
    "title": "Two Sum",
    "description": "Given an array of integers...",
    "user_code": "function twoSum(nums, target) {...}",
    "conversation_history": [
        {"role": "assistant", "content": "Previous hint..."},
        {"role": "user", "content": "What about edge cases?"}
    ],
    "follow_up_question": "Can you explain the time complexity?"
}
```

**Response:**
```json
{
    "hint": "Your current approach has O(n²) complexity...",
    "problem_id": 123
}
```

---

### `GET /api/problems/`
Get all problems for authenticated user.

**Response:**
```json
[
    {
        "id": 1,
        "title": "Two Sum",
        "description": "...",
        "user_code": "...",
        "ai_hint": "...",
        "date": "2024-01-15T10:30:00Z",
        "status": "Solved",
        "tags": ["Array", "Hash Table"]
    }
]
```

---

### `GET /api/problems/{id}/`
Get single problem detail.

---

### `PATCH /api/problems/{id}/`
Update problem (e.g., change status).

**Request:**
```json
{
    "status": "Solved"
}
```

---

### `DELETE /api/problems/{id}/`
Delete a problem.

---

### `GET /api/stats/`
Get user statistics.

**Response:**
```json
{
    "total_problems": 15,
    "solved": 8,
    "need_revision": 4,
    "pending": 3
}
```

---

## Database Schema

### User (Django's built-in)
```
┌─────────────────────────────────────────────┐
│ auth_user                                   │
├─────────────────────────────────────────────┤
│ id            │ INTEGER PRIMARY KEY         │
│ username      │ VARCHAR (Firebase UID)      │
│ email         │ VARCHAR                     │
│ first_name    │ VARCHAR                     │
│ last_name     │ VARCHAR                     │
│ password      │ VARCHAR (unused for OAuth)  │
│ is_active     │ BOOLEAN                     │
│ date_joined   │ DATETIME                    │
└─────────────────────────────────────────────┘
```

### Problem
```
┌─────────────────────────────────────────────┐
│ api_problem                                 │
├─────────────────────────────────────────────┤
│ id            │ INTEGER PRIMARY KEY         │
│ user_id       │ FK -> auth_user.id          │
│ title         │ VARCHAR(255)                │
│ description   │ TEXT                        │
│ user_code     │ TEXT                        │
│ ai_hint       │ TEXT                        │
│ date          │ DATETIME (auto)             │
│ status        │ VARCHAR(20)                 │
│ tags          │ JSON                        │
└─────────────────────────────────────────────┘
```

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Chrome browser
- Firebase project
- Groq account (free at console.groq.com)
- NeonDB account (optional - SQLite used for local dev)

### 1. Clone Repository
```bash
git clone https://github.com/sahilrm794/Leetcode-Helper.git
cd Leetcode-helper
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
# Edit .env file with your credentials

# Copy firebase-service-account.json to backend folder

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend/Leetcode-dashboard

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Extension Setup
1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder

---

## Common Issues & Troubleshooting

### Issue: "Connection timed out" to NeonDB
**Cause:** NeonDB free tier auto-suspends inactive projects.
**Solution:**
1. Comment out `DATABASE_URL` in `.env` to use SQLite for local dev
2. OR go to NeonDB console and wake up your project
3. Run `python manage.py migrate` after switching databases

### Issue: "Firebase token verification failed"
**Cause:** firebase-service-account.json not found or invalid.
**Solution:**
1. Download new service account key from Firebase Console
2. Place in backend folder
3. Update path in .env

### Issue: Extension shows "Not on LeetCode"
**Cause:** Content script only runs on `leetcode.com/problems/*`
**Solution:** Navigate to an actual LeetCode problem page

### Issue: "Failed to fetch problem data"
**Cause:** Content script not loaded or LeetCode DOM changed.
**Solution:**
1. Refresh the LeetCode page
2. Click extension again
3. If persists, check content.js selectors

### Issue: Hints not saving to dashboard
**Cause:** User not logged in, token expired, or migrations not run.
**Solution:**
1. Ensure `python manage.py migrate` was run
2. Click "Sign in" in extension
3. Complete Google OAuth flow (handled by background.js)
4. Reopen extension popup - you should see your avatar
5. Try again

### Issue: CORS errors
**Cause:** Backend CORS not configured properly.
**Solution:** Ensure `corsheaders` is in INSTALLED_APPS and MIDDLEWARE.

---

## Environment Variables

### Backend (.env)
```
GROQ_API_KEY=your_groq_api_key
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
# DATABASE_URL=postgresql://user:pass@host/db?sslmode=require  # Uncomment for NeonDB
SECRET_KEY=your_django_secret_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Extension (config.js)
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000/api',
    FIREBASE: { ... }
};
```

---

## Security Considerations

1. **API Keys:** Never commit API keys. Use environment variables.
2. **Firebase Service Account:** Keep private, add to .gitignore.
3. **CORS:** Restrict origins in production.
4. **Token Validation:** Always verify Firebase tokens on backend.
5. **Input Sanitization:** Validate all user inputs.

---

## Future Enhancements

- [ ] Firefox extension support
- [ ] Problem bookmarking
- [ ] Adaptive hint difficulty
- [ ] Code diff visualization
- [ ] Multi-language support
- [ ] Team/classroom features
- [ ] Analytics dashboard
- [ ] Mobile app

---

### Issue: "Sign in" button doesn't work in extension
**Cause:** Old extension version with auth listener in popup.js.
**Solution:**
1. Go to `chrome://extensions/`
2. Reload the extension
3. Auth is now handled by `background.js` (persists when popup closes)

### Issue: Groq API errors
**Cause:** Invalid API key or rate limit exceeded.
**Solution:**
1. Verify `GROQ_API_KEY` in `.env` starts with `gsk_`
2. Check Groq console for rate limits (free tier: 30 req/min)
3. Restart Django server after changing `.env`

---

*Last updated: February 2026*
*Author: Sahil Rajesh Mustilwar*
