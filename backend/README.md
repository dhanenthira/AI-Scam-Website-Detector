# ScamGuard AI - Backend API

Production-ready **Django REST Framework** backend for **ScamGuard AI**, an AI-powered scam and malicious website detector with contextual AI security advisory chat.

---

## Tech Stack

- **Python 3.12+**
- **Django & Django REST Framework**
- **PostgreSQL** (with dynamic SQLite fallback for development)
- **SimpleJWT** (JSON Web Tokens)
- **BeautifulSoup4 & Requests** (Safe DOM parsing & HTTP probing)
- **Google Gemini API / OpenAI API** (AI threat analysis & chatbot)
- **django-cors-headers** (Configured for React frontend)
- **drf-spectacular** (OpenAPI 3.0 & Swagger UI documentation)

---

## Project Structure

```text
backend/
│
├── manage.py
│
├── config/
│   ├── __init__.py
│   ├── settings.py          # CORS, JWT, PostgreSQL, Security, Throttling
│   ├── urls.py              # Root router & Swagger endpoints
│   ├── wsgi.py
│   ├── asgi.py
│   └── exceptions.py        # Centralized {"error": "..."} response handler
│
├── accounts/
│   ├── models.py            # User profile and scan tracking
│   ├── serializers.py       # Register, login, profile, logout serializers
│   ├── views.py             # Auth endpoints
│   ├── urls.py              # /api/auth/
│   ├── admin.py             # User admin customizations
│   └── tests.py             # Auth test suite
│
├── scanner/
│   ├── models.py            # WebsiteScan model with indexes & risk levels
│   ├── serializers.py       # Scan request, response, history, and detail
│   ├── views.py             # Scanning, user history, detail, delete
│   ├── services.py          # Modular scanner, SSRF guard, SSL, DOM, scoring
│   ├── urls.py              # /api/scanner/
│   ├── admin.py             # WebsiteScan admin with filters
│   └── tests.py             # Scanner & SSRF test suite
│
├── chatbot/
│   ├── serializers.py       # Chat query and answer serializers
│   ├── views.py             # /api/chat/
│   ├── services.py          # Grounded AI reasoning & heuristic fallback
│   ├── urls.py
│   ├── admin.py
│   └── tests.py             # Chatbot test suite
│
├── requirements.txt
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## Quick Start & Setup

### 1. Create and Activate Virtual Environment

```bash
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables Configuration

Copy `.env.example` to `.env` and configure your credentials:

```env
SECRET_KEY=your_production_secret_key
DEBUG=True

# PostgreSQL Database Settings
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=scamguard
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Set to True to automatically fallback to SQLite if PostgreSQL is unavailable locally
FALLBACK_TO_SQLITE=True

# AI API Configuration (Gemini or OpenAI)
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_or_openai_api_key
AI_MODEL=gemini-1.5-flash

# Network & Host Settings
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

### 4. Database Setup & Migrations

If using PostgreSQL, ensure the `scamguard` database exists:
```sql
CREATE DATABASE scamguard;
```

Run Django migrations:
```bash
python manage.py migrate
```

Create a superuser for Django Admin:
```bash
python manage.py createsuperuser
```

### 5. Run Tests

```bash
python manage.py test
```

### 6. Start the Server

```bash
python manage.py runserver 8000
```

The server will be accessible at `http://127.0.0.1:8000/`.

---

## API Endpoints Reference

### 1. Interactive Swagger Documentation
- **Swagger UI**: `GET /api/docs/`
- **ReDoc**: `GET /api/redoc/`
- **OpenAPI Schema**: `GET /api/schema/`

---

### 2. Authentication (`/api/auth/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register new user with hashed password | No |
| `POST` | `/api/auth/login/` | Login with username/email & password | No |
| `POST` | `/api/auth/token/refresh/` | Refresh JWT access token | No |
| `GET` | `/api/auth/profile/` | Get current user's profile | **Yes (Bearer JWT)** |
| `POST` | `/api/auth/logout/` | Blacklist refresh token & logout | **Yes (Bearer JWT)** |

#### Register Request Body:
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "Password123!",
  "password2": "Password123!"
}
```

#### Login Request Body:
```json
{
  "username": "user123",
  "password": "Password123!"
}
```

#### Successful Auth Response:
```json
{
  "message": "Login successful.",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com"
  },
  "tokens": {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi..."
  }
}
```

---

### 3. Website Scanner (`/api/scanner/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/scanner/scan/` | Scan URL, analyze threats, calculate risk score | Optional (attached to user if logged in) |
| `GET` | `/api/scanner/history/` | List authenticated user's previous scans | **Yes (Bearer JWT)** |
| `GET` | `/api/scanner/history/<id>/` | View full detailed scan report | **Yes (Bearer JWT, Owner only)** |
| `DELETE` | `/api/scanner/history/<id>/` | Delete scan from history | **Yes (Bearer JWT, Owner only)** |

#### Scan Request:
```json
{
  "url": "https://example.com"
}
```

#### Scan Response:
```json
{
  "id": 12,
  "url": "https://example.com",
  "domain": "example.com",
  "risk_score": 86,
  "risk_level": "LOW",
  "ssl_status": true,
  "phishing_detected": false,
  "malware_detected": false,
  "suspicious_redirects": false,
  "domain_age": "8 months",
  "security_summary": "No major suspicious indicators were detected, but the domain is relatively new."
}
```

#### History List Response:
```json
[
  {
    "id": 12,
    "url": "https://example.com",
    "risk_score": 86,
    "risk_level": "LOW",
    "created_at": "2026-09-25T10:30:00Z"
  }
]
```

---

### 4. AI Security Chatbot (`/api/chat/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/chat/` | Ask questions about a specific website scan | Optional (restricted if scan is private to another user) |

#### Chat Request:
```json
{
  "scan_id": 12,
  "message": "Why did this website receive a score of 86?"
}
```

#### Chat Response:
```json
{
  "answer": "The website received a score of 86 because no major phishing or malware indicators were detected. However, the domain is relatively new, so some caution is recommended."
}
```

---

## Security Protections Implemented

1. **SSRF (Server-Side Request Forgery) Prevention**:
   - Rejects loopback (`127.0.0.1`, `localhost`), link-local (`169.254.0.0/16`), private networks (RFC 1918), and multicast IP ranges.
   - Redirect targets are inspected dynamically against the SSRF filter before following.
2. **Safe Fetching & DoS Protection**:
   - Enforces a 2MB maximum download size per website scan to prevent memory exhaustion attacks.
   - Strict connection and read timeouts (7 seconds).
   - Maximum redirect hops limit (5 hops).
3. **Never Executes JavaScript**:
   - Website HTML is parsed statically using BeautifulSoup4. JavaScript is never executed.
4. **AI Context Sanitization**:
   - Strips `<script>`, `<style>`, and binary data before sending text snippets to AI models.
5. **No Absolute Safety Claims**:
   - AI prompts and heuristic engines are strictly constrained to never promise 100% safety.
6. **Password Security**:
   - Uses Django's PBKDF2 with SHA-256 password hashing. Passwords are never stored or transmitted in plain text.
7. **Rate Limiting**:
   - DRF Throttles protect scanning and auth endpoints from brute force and scanning abuse.
8. **Consistent Error JSON**:
   - Unhandled exceptions and validation errors return standardized `{ "error": "..." }` responses without leaking internal stack traces.
