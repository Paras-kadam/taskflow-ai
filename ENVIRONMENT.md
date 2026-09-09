# TaskFlow AI — Environment Variables Reference

This document provides a comprehensive guide to all environment variables used by TaskFlow AI in development and production.

---

## 🔒 Security Principles
1. **Never commit `.env` files**: All environment files containing secrets must be kept out of version control (`.gitignore` enforces this).
2. **Use high-entropy secrets**: Production `JWT_SECRET` must be a random cryptographic string with at least 32 characters.
3. **Restricted CORS origins**: In production, `CLIENT_URL` must point only to your trusted deployed frontend origin(s), never wildcard `*`.

---

## Backend Environment Variables (`server/`)

Configure these variables in your **Render Web Service Dashboard** (or in `server/.env` for local development):

| Variable | Required | Default / Dev Value | Production Example | Description |
|---|---|---|---|---|
| `NODE_ENV` | **Yes** | `development` | `production` | Sets runtime optimizations, secure cookie flags, and error formatting |
| `PORT` | **Yes** | `5000` | `10000` | Port the Express HTTP server listens on (Render automatically injects `10000`) |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/taskflow` | `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority` | Connection string for MongoDB (local or Atlas) |
| `JWT_SECRET` | **Yes** | `fallback_secret_for_development_only` | `YOUR_SUPER_STRONG_RANDOM_SECRET_KEY_MIN_32_CHARS` | Symmetric secret key used to sign and verify JSON Web Tokens |
| `JWT_EXPIRES_IN` | No | `7d` | `7d` | Lifetime duration for user session tokens |
| `CLIENT_URL` | **Yes** | `http://localhost:5173` | `https://YOUR-APP.vercel.app` | Allowed frontend origin for CORS. Supports comma-separated list |
| `AI_PROVIDER` | No | *(empty)* | `gemini` or `openai` | Optional external AI model enhancement provider |
| `OPENAI_API_KEY`| No | *(empty)* | `sk-proj-...` | Optional OpenAI API key (app functions without it via built-in NLP) |
| `GEMINI_API_KEY`| No | *(empty)* | `AIzaSy...` | Optional Google Gemini API key |

### Backend Production Template
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://taskflow_user:YOUR_SECURE_PASSWORD@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET=c8f1e94a82b45df891c34a10e7b8c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9
JWT_EXPIRES_IN=7d
CLIENT_URL=https://taskflow-ai.vercel.app
```

---

## Frontend Environment Variables (`client/`)

Configure these variables in your **Vercel Project Settings** under **Environment Variables** (or in `client/.env.local` for local development):

| Variable | Required | Default / Dev Value | Production Example | Description |
|---|---|---|---|---|
| `VITE_API_URL` | **Yes (in prod)** | `""` *(empty string)* | `https://YOUR-BACKEND.onrender.com` | Base URL for REST API calls. In local dev, leave empty to use Vite proxy |

### Frontend Production Template
```env
VITE_API_URL=https://taskflow-backend.onrender.com
```

### Frontend Development Template (`client/.env.local`)
```env
# Leave empty in local dev to proxy requests to http://localhost:5000
VITE_API_URL=
```
