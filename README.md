# RankEngine AI

RankEngine AI is a SaaS platform designed for web crawling and LLM synthesis. This repository is structured as a monorepo containing the web frontend, api backend, background crawling worker, and shared configurations.

## Repository Structure

```
/RankEngine-AI
├── apps/
│   ├── api/          # Node.js + Express backend (TypeScript)
│   ├── web/          # React + TypeScript frontend (Vite)
│   └── worker/       # Python microservice (FastAPI + Poetry)
├── packages/
│   └── shared-types/ # Shared TypeScript types/interfaces
├── docker-compose.yml# Local infrastructure (MongoDB & Redis)
├── package.json      # Root workspaces configuration
└── README.md         # Documentation
```

## Prerequisites

Before starting, ensure you have the following installed on your machine:
1. **Node.js** (v18+ recommended) & `npm`
2. **Python** (v3.11+) & **Poetry**
3. **Docker & Docker Compose**

---

## Local Setup & Quick Start

### 1. Launch Infrastructure Services (MongoDB & Redis)
To spin up the local development database and cache containers, run:
```bash
docker compose up -d
```
This maps standard ports:
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

### 2. Node.js Services Setup (API, Web, Shared Types)
From the root directory, install all Node packages and establish local workspace symlinks:
```bash
npm install
```

To run individual workspaces, you can use npm workspace execution commands from the root:
* **API Backend**: `npm run dev:api`
* **Web Frontend**: `npm run dev:web`

Or run build/lint/format commands globally:
```bash
npm run build
npm run lint
npm run format
```

### 3. Python Worker Service Setup
Navigate to the worker directory and install dependencies via Poetry:
```bash
cd apps/worker
poetry env use python3.11
poetry install
```

To start the worker FastAPI service locally:
```bash
poetry run uvicorn main:app --reload --port 8000
```
Visit health check at `http://localhost:8000/health`.
