# LeetCode Helper - Challenges, Scaling & Limitations

## Table of Contents
1. [Challenges Faced](#challenges-faced)
2. [Current Limitations](#current-limitations)
3. [How to Scale](#how-to-scale)
4. [Technical Debt](#technical-debt)

---

## Challenges Faced

### 1. Chrome Extension Popup Lifecycle

**Problem:** The Chrome extension popup closes the instant the user clicks away or switches tabs. Any JavaScript running in `popup.js` is immediately killed.

**Impact:** The original login flow registered a `chrome.tabs.onUpdated` listener in `popup.js` to catch the auth callback URL. When the user clicked "Sign in", the extension opened a new tab - which caused the popup to close. The listener died with it, so the auth token was never captured.

**Solution:** Moved the auth callback listener to `background.js` (the service worker), which persists independently of the popup lifecycle. The background script saves auth data to `chrome.storage.local`, and the popup reads it on next open via `checkAuthState()`.

**Lesson:** Never put critical event listeners in popup.js if they depend on external navigation. Always use background.js for anything that needs to survive popup close.

---

### 2. LeetCode DOM Scraping Instability

**Problem:** LeetCode is a React SPA that frequently changes its DOM structure, class names, and component hierarchy. There is no stable API to access problem data.

**Impact:** Content script selectors like `div.text-title-large a[href^="/problems/"]` for the title or `.view-line` for Monaco editor code can break without warning when LeetCode ships an update.

**Solution:** Implemented multiple fallback selectors for each piece of data (title, description, code). The content script tries selectors in priority order and falls back gracefully.

**Lesson:** Web scraping-based extensions are inherently fragile. Defensive coding with fallbacks is essential. An alternative approach would be to use LeetCode's GraphQL API (if accessible), but that has its own challenges with CORS and authentication.

---

### 3. NeonDB Connection Timeouts

**Problem:** NeonDB's free tier auto-suspends database projects after a period of inactivity. When Django starts, it immediately tries to check migrations against the database. If NeonDB is suspended, this connection times out after ~45 seconds and crashes the entire Django server.

**Impact:** The backend wouldn't even start, let alone serve API requests. The extension showed "Failed to fetch" because there was no server running.

**Solution:** Added SQLite as a fallback database for local development. When `DATABASE_URL` is not set (or commented out) in `.env`, Django automatically uses SQLite. This decouples local development from NeonDB availability.

```python
# settings.py
if DATABASE_URL:
    DATABASES = {...}  # PostgreSQL (NeonDB)
else:
    DATABASES = {...}  # SQLite fallback
```

**Lesson:** Never hard-depend on a cloud database for local development. Always have a local fallback, especially with free-tier services that have availability constraints.

---

### 4. Gemini API Quota Exhaustion

**Problem:** The Google Gemini API returned a quota error with `limit: 0`, meaning the free tier was completely exhausted or billing wasn't enabled for the API key.

**Impact:** The extension couldn't generate any hints. The error message was cryptic and didn't clearly indicate whether it was a temporary or permanent issue.

**Solution:** Switched from Gemini to Groq API, which offers:
- Generous free tier (30 requests/minute, 14,400/day)
- OpenAI-compatible REST API (easy migration)
- LLaMA 3.3 70B model (high quality)
- Extremely fast inference (~500 tokens/sec)

**Migration effort:** Changed 3 files:
- `.env` - Replaced API key
- `settings.py` - Renamed config variable
- `views.py` - Rewrote API call function (different endpoint, auth method, and response format)

**Lesson:** Don't couple your application to a single AI provider. Use an abstraction layer or at minimum keep the API call isolated in a single function for easy swapping. OpenAI-compatible APIs (Groq, Together, Fireworks) make migration straightforward.

---

### 5. Cross-Origin Communication (Extension <-> Backend <-> Frontend)

**Problem:** Three separate applications (Chrome extension, Django backend, Next.js frontend) running on different origins need to communicate securely.

**Impact:** Without proper CORS configuration, the browser blocks cross-origin requests. Chrome extensions have additional restrictions with Manifest V3.

**Solution:**
- `django-cors-headers` middleware configured to allow requests from all development origins
- Extension's `manifest.json` declares `host_permissions` for the backend URL
- `CORS_ALLOW_CREDENTIALS = True` to allow auth headers
- Explicit `CORS_ALLOW_HEADERS` list including `authorization`

**Lesson:** Cross-origin communication in a multi-app architecture requires careful planning. Each component has different CORS rules and security models.

---

### 6. Firebase Token Flow for Chrome Extensions

**Problem:** Chrome extensions can't use Firebase's client SDK directly (Manifest V3 service workers don't support DOM-dependent libraries). The extension needed Firebase auth but couldn't run Firebase JavaScript SDK.

**Impact:** Couldn't do direct Google OAuth from the extension popup.

**Solution:** Delegated auth to the Next.js frontend:
1. Extension opens frontend login page with `?extension=true`
2. Frontend handles Firebase auth (has full SDK access)
3. Frontend redirects to `/auth-callback` with token in URL
4. Extension's background.js reads the URL and saves the token

**Lesson:** Sometimes the simplest solution is to delegate to a component that already has the capability, rather than trying to replicate it in a constrained environment.

---

### 7. Stateless Authentication Across Components

**Problem:** The extension stores a static Firebase ID token. Firebase tokens expire after 1 hour. The backend verifies tokens on every request, so expired tokens cause 401 errors.

**Impact:** Users who logged in more than 1 hour ago silently lose authentication. Hints still work (AllowAny permission) but aren't saved to their account.

**Solution (current):** Users must re-login when the token expires.

**Better solution (future):** Implement token refresh using Firebase's `getIdToken(true)` which auto-refreshes expired tokens. This requires the Firebase SDK in the extension or periodic token refresh via the frontend.

---

### 8. Conversation Context Memory Loss

**Problem:** The extension's conversation history (`conversationHistory` array) lives in `popup.js` variables. When the popup closes, all context is garbage collected.

**Impact:** If a user is in the middle of a productive conversation about a problem and accidentally closes the popup, they lose all context and have to start over.

**Solution (current):** Accepted as a design trade-off. The initial hint and follow-up hints are saved to the database (if logged in), so the content isn't lost - just the conversation structure.

**Future improvement:** Save conversation history to `chrome.storage.local` keyed by problem URL, and restore it when the popup reopens on the same problem.

---

## Current Limitations

### Functional Limitations

| Limitation | Impact | Severity |
|-----------|--------|----------|
| **Token expires after 1 hour** | User must re-login; hints not saved after expiry | Medium |
| **Conversation context lost on popup close** | Can't continue previous conversations | Medium |
| **No offline support** | Requires backend server running | High |
| **Single problem per session** | Opening popup on new problem starts fresh | Low |
| **No code diff tracking** | Can't see what changed between hints | Low |
| **No retry mechanism** | API failures require manual retry | Medium |

### Technical Limitations

| Limitation | Detail |
|-----------|--------|
| **SQLite in development** | Single-writer, no concurrent access, not suitable for production |
| **No rate limiting** | Backend doesn't limit API calls per user |
| **No caching** | Same problem re-analyzed every popup open |
| **Synchronous API calls** | Groq call blocks the Django thread |
| **No WebSocket support** | Can't stream AI responses in real-time |
| **No error recovery** | If content script fails to scrape, no retry logic |
| **Firebase token not refreshed** | Static token stored in extension, expires in 1 hour |
| **No input validation on AI prompt** | Prompt injection possible via crafted problem descriptions |
| **No test suite** | No unit tests, integration tests, or E2E tests |

### Platform Limitations

| Limitation | Detail |
|-----------|--------|
| **Chrome only** | No Firefox, Safari, or Edge support |
| **Desktop only** | No mobile app or responsive extension |
| **LeetCode only** | Doesn't work on Codeforces, HackerRank, etc. |
| **English only** | No multi-language support for hints |
| **Local development only** | Not deployed to production |

### Groq API Limitations

| Limit | Value |
|-------|-------|
| **Free tier rate limit** | 30 requests/minute |
| **Daily limit** | ~14,400 requests/day |
| **Max tokens per request** | 32,768 (model dependent) |
| **Context window** | 128K tokens (LLaMA 3.3 70B) |
| **Model selection** | Currently hardcoded to `llama-3.3-70b-versatile` |

---

## How to Scale

### Phase 1: Production-Ready (Single Server)

**Goal:** Deploy to a server and handle ~100 concurrent users.

#### Database
- Switch from SQLite to PostgreSQL (NeonDB or self-hosted)
- Add database indexes on `Problem.user_id` and `Problem.date`
- Implement connection pooling with `pgBouncer` or Django's `CONN_MAX_AGE`

```python
# settings.py
DATABASES = {
    'default': {
        ...
        'CONN_MAX_AGE': 600,  # Reuse connections for 10 minutes
    }
}
```

#### API Rate Limiting
- Add `django-ratelimit` or `djangorestframework-throttling`
- Limit to ~10 requests/minute per authenticated user
- Higher limits for unauthenticated users (to prevent abuse)

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '10/minute',
        'anon': '3/minute',
    }
}
```

#### Caching
- Cache AI responses for identical problem+code combinations
- Use Django's cache framework with Redis backend
- Cache key: `hash(title + user_code)`
- TTL: 1 hour (user might update code)

```python
from django.core.cache import cache

cache_key = hashlib.md5(f"{title}{user_code}".encode()).hexdigest()
cached_hint = cache.get(cache_key)
if cached_hint:
    return Response({'hint': cached_hint, 'cached': True})
```

#### Deployment
- Deploy Django to Railway, Render, or AWS EC2
- Deploy Next.js to Vercel
- Use environment variables for all secrets
- Enable HTTPS everywhere
- Restrict CORS to specific production domains

---

### Phase 2: Multi-Server (1,000+ Users)

**Goal:** Handle traffic spikes and provide reliability.

#### Architecture Change

```
                    ┌──────────────┐
                    │  Load        │
                    │  Balancer    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼───┐  ┌────▼────┐  ┌───▼──────┐
        │ Django  │  │ Django  │  │ Django   │
        │ Worker 1│  │ Worker 2│  │ Worker 3 │
        └─────┬───┘  └────┬────┘  └───┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼───┐  ┌────▼────┐  ┌───▼──────┐
        │ Redis   │  │ PostgreSQL│ │  Celery  │
        │ Cache   │  │ Primary  │  │ Workers  │
        └─────────┘  └─────────┘  └──────────┘
```

#### Async AI Calls
- Move Groq API calls to Celery background tasks
- Return a job ID immediately, poll for results
- Or use WebSockets/SSE for real-time streaming

```python
# tasks.py
@shared_task
def generate_hint_async(problem_data):
    hint = call_groq_api(build_prompt(problem_data))
    cache.set(f"hint_{problem_data['job_id']}", hint)
    return hint
```

#### Database Optimization
- Read replicas for dashboard queries
- Partitioning on `Problem.user_id` for large datasets
- Full-text search indexes for problem search

#### AI Provider Redundancy
- Add fallback providers (OpenAI, Anthropic, Together AI)
- If Groq is down or rate-limited, automatically switch
- Abstract AI calls behind a provider interface

```python
class AIProvider:
    def generate(self, prompt: str) -> str:
        raise NotImplementedError

class GroqProvider(AIProvider):
    def generate(self, prompt):
        # Groq API call
        ...

class OpenAIProvider(AIProvider):
    def generate(self, prompt):
        # OpenAI API call (fallback)
        ...
```

---

### Phase 3: Large Scale (10,000+ Users)

**Goal:** Global availability, analytics, and advanced features.

#### Infrastructure
- Kubernetes cluster with auto-scaling
- CDN for frontend (Vercel Edge / CloudFront)
- Multi-region database (CockroachDB or Aurora Global)
- Message queue (RabbitMQ / SQS) for async processing

#### Advanced Features
- **Streaming responses:** SSE/WebSocket for character-by-character AI output
- **Problem recommendations:** ML-based "what to solve next" engine
- **Code analysis history:** Track user's code evolution across sessions
- **Team/classroom mode:** Instructors can see student progress
- **Analytics dashboard:** Problem difficulty distribution, time spent, improvement trends
- **Multi-platform:** Firefox, Safari, HackerRank, Codeforces support

#### Cost Management
- Implement tiered plans (free: 10 hints/day, pro: unlimited)
- Token counting and budget alerts
- Prompt optimization to reduce token usage
- Fine-tuned smaller model for common problems (reduces cost)

#### Monitoring
- Application monitoring (Sentry for errors)
- API metrics (Prometheus + Grafana)
- AI quality monitoring (track user satisfaction with hints)
- Uptime monitoring (PagerDuty/Better Uptime)

---

## Technical Debt

### Current Debt Items

| Item | Severity | Effort to Fix |
|------|----------|---------------|
| No test suite at all | High | High |
| Hardcoded Groq model name in views.py | Low | Low |
| `get_hint` comment still says "Gemini" | Low | Low |
| No input sanitization for AI prompts | Medium | Medium |
| Firebase token not auto-refreshed | Medium | Medium |
| No logging (only print statements) | Medium | Low |
| No API versioning (`/api/v1/`) | Low | Medium |
| SQLite in development means different behavior from production | Medium | Low |
| No database migrations for index optimization | Low | Medium |
| Secret key in `.env` is the Django default insecure key | High | Low |

### Priority Actions

1. **Add basic tests** - At minimum, test the hint endpoint with mocked Groq responses
2. **Add structured logging** - Replace print statements with Python's logging module
3. **Fix token refresh** - Auto-refresh Firebase tokens in the extension
4. **Add rate limiting** - Prevent API abuse
5. **Generate a proper SECRET_KEY** - Replace the insecure default

---

*Last updated: February 2026*
*Author: Sahil Rajesh Mustilwar*
