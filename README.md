# RunNow — Hybrid Code Execution Platform

Monaco-powered IDE with 70+ languages. Client-side JS/TS + Dockerized Piston execution. Go backend, JWT, MongoDB persistence, workspace sharing, multi-file projects.

## Stack

- **Backend**: Go + Gin, JWT, MongoDB, Piston API (`https://emkc.org/api/v2/piston` or self-hosted)
- **Frontend**: React + Vite + Monaco Editor + Zustand
- **Infra**: Docker & docker-compose, Piston (Dockerized)

## Quick start

```bash
docker compose up --build
# web  -> http://localhost:3000
# api  -> http://localhost:8080
# piston -> http://localhost:2000
```

Local dev without docker:

```bash
# backend
cd backend
cp ../.env.example .env
go run ./cmd/server

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Features

- **70+ languages** via Piston runtimes, fetched live + fallback
- **Hybrid execution**: JS/TS runs locally for instant feedback, always also tries Piston; all other languages via Piston/Docker
- **Monaco IDE** with language-aware editing, multi-file tabs, rename, cross-file imports (all files sent together)
- **JWT auth** — register/login/me, token in Authorization header
- **Workspace persistence** — MongoDB stores multi-file workspaces per user
- **File sharing** — share_id + `/s/:shareId` links, public/private toggle, fork
- **Realtime execution** with stdin, args, multi-file payload

## API

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me              (auth)
GET    /api/languages
GET    /api/runtimes
POST   /api/execute              { language, version, files: [{name,content}], stdin }
POST   /api/workspaces           (auth)
GET    /api/workspaces           (auth - list own + public)
GET    /api/workspaces/:id       (auth)
PUT    /api/workspaces/:id       (auth)
DELETE /api/workspaces/:id       (auth)
POST   /api/workspaces/:id/fork  (auth)
POST   /api/workspaces/:id/share (auth)
GET    /api/shares/:shareId
```

## Env

See `.env.example`. Set `PISTON_URL` to self-hosted `http://piston:2000/api/v2/piston` when using docker-compose.

## GitHub

Push and enable GitHub repo — OAuth placeholder ready at `/api/auth/github/callback` (wire `GITHUB_CLIENT_ID/SECRET`).
