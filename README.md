# RunNow 🚀

A production-grade **hybrid code runner** supporting 70+ languages, with client-side execution for Python and Node.js and a Dockerised Piston fallback for everything else.

## Features

- ⚡ **Client-side execution** — Python via [Pyodide](https://pyodide.org/), Node.js via [WebContainers](https://webcontainers.io/)
- 🌐 **70+ language support** — C++, Rust, Go, Java, PHP, Ruby and more via [Piston](https://github.com/engineer-man/piston)
- 🗂️ **Multi-file Runtainers** — Named workspaces with multiple files, full cross-file imports
- 🔒 **JWT Auth** — Register/Login, persist and share workspaces
- 🎨 **Stark Black & White UI** — Monaco editor, shadcn/ui, Tailwind CSS

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, TypeScript, Monaco Editor, Tailwind CSS, shadcn/ui, Zustand |
| Backend | Bun.js, Elysia.js, MongoDB (Mongoose), JWT |
| Execution | Pyodide, WebContainers, Piston (Docker) |

## Project Structure

```
runnow/
├── frontend/          # React + Vite app
│   └── src/
│       ├── components/
│       │   ├── Editor/        # Monaco editor wrapper
│       │   ├── Execution/     # HybridExecutor, PyodideRunner, WebContainerRunner
│       │   └── ui/            # shadcn components
│       ├── pages/             # LandingPage, Dashboard, IDEPage
│       └── store/             # Zustand store
└── backend/           # Bun + Elysia API
    └── src/
        ├── routes/    # /run, /auth, /runtainers, /history
        └── models/    # Mongoose schemas
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.x
- [Node.js](https://nodejs.org/) v20+
- [Docker](https://docker.com/) (for Piston)
- [MongoDB](https://mongodb.com/) instance

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/runnow.git
cd runnow

# Backend
cd backend && bun install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/runnow
JWT_SECRET=your-secret-here
PISTON_URL=http://localhost:2000
```

### 3. Start Piston (Docker)

```bash
docker compose up -d
```

### 4. Run

```bash
# Backend (from /backend)
bun run src/index.ts

# Frontend (from /frontend)
npm run dev
```

App runs at **http://localhost:5173**, API at **http://localhost:3000**.

## Keyboard Shortcuts (IDE)

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Run code |
| `Ctrl+S` | Save Runtainer |
| `Ctrl+L` | Clear output |

## License

MIT
