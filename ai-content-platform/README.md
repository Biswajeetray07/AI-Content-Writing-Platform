# AI Content Writing Platform — Setup & Run Guide

A full-stack AI-powered content generation platform.

| Component | Tech | Port |
|-----------|------|------|
| **Frontend** | Next.js 16 (App Router) + TailwindCSS | `3000` |
| **Backend** | Node.js + Express 5 + TypeScript | `5000` |
| **AI Engine** | Python + FastAPI + LangGraph + Gemini | `8000` |
| **Database** | Supabase PostgreSQL (via REST API) | — |

---

## Prerequisites

- **Node.js** v18+
- **Python** v3.9+
- **Supabase** project ([supabase.com](https://supabase.com))
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

---

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — fill in SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET
```

### 2. AI Engine
```bash
cd ai_engine
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL (default: http://localhost:5000)
```

---

## Running (3 Terminals)

```bash
# Terminal 1: AI Engine
cd ai_engine && python main.py

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## Architecture

```
Browser → Next.js (3000) → Express API (5000) → FastAPI AI Engine (8000)
                                 ↓                      ↓
                          Supabase DB            Google Gemini API
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login, get JWT |
| GET | `/auth/me` | JWT | Get profile |
| POST | `/api/content/generate` | JWT | Generate AI content |
| GET | `/api/content` | JWT | List documents |
| GET | `/api/health` | — | Health check |
