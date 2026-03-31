# Deployment Guide

This project is split into:
- Backend: Node.js/Express in backend
- Frontend: Vite/React in frontend/india-ecom

## 1) Backend on Render

Option A (UI setup):

Create a new Web Service with:
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start

Option B (Blueprint):
- Use render.yaml at repo root to provision backend settings.

Set environment variables in Render:
- MONGO_URI
- JWT_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- FRONTEND_URL (set to your frontend domain, e.g. https://your-app.vercel.app)
- PORT (optional; Render usually injects this)

Notes:
- Multiple allowed frontend origins are supported via comma-separated FRONTEND_URL values.
- Example: FRONTEND_URL=https://your-app.vercel.app,http://localhost:5173

Health check endpoint:
- GET /api/health

## 2) Frontend on Vercel

Import the same repository and configure:
- Root Directory: frontend/india-ecom
- Build Command: npm run build
- Output Directory: dist

Set environment variable:
- VITE_API_BASE=https://your-backend.onrender.com

SPA routing support:
- vercel.json is included in frontend/india-ecom so client-side routes resolve to index.html.

## 3) Update CORS and Redeploy

After frontend is live:
1. Copy frontend URL.
2. Set backend FRONTEND_URL to that value (or append it if keeping localhost for dev).
3. Redeploy backend.

## 4) Local Development

Backend:
1. Copy backend/.env.example to backend/.env and fill values.
2. Run npm install and npm run dev inside backend.

Frontend:
1. Copy frontend/india-ecom/.env.example to frontend/india-ecom/.env.
2. Set VITE_API_BASE to local backend URL.
3. Run npm install and npm run dev inside frontend/india-ecom.

## 5) Security Checklist

- Never commit .env files.
- Rotate any secret that was shared publicly.
- Use strong, random JWT secrets in production.
