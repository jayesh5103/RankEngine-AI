# Deployment Guide — RankEngine AI

This document details the production configuration and deployment runbook for the RankEngine AI application stack.

---

## 1. Environment Variable Specifications

Ensure the following environment variables are securely set in your production hosting environment (e.g. AWS ECS Task Definitions, Kubernetes Secrets, Vercel/Render Environment Settings).

### 1.1 Express API Server (`/apps/api`)

| Env Var | Type | Production Requirement | Description |
|---|---|---|---|
| `PORT` | Number | `3000` | Port the API container binds to |
| `NODE_ENV` | String | `production` | Enables production error handling and forces key checks |
| `MONGODB_URI` | URL | **Required** (Secret) | Production MongoDB connection string (e.g., MongoDB Atlas) |
| `REDIS_URL` | URL | **Required** (Secret) | Production Redis connection string (e.g., ElastiCache) |
| `JWT_SECRET` | String | **Required** (Secret) | High-entropy random signing key (min 32 characters) |
| `JWT_EXPIRY` | String | `7d` | Tokens valid duration |
| `ENCRYPTION_KEY` | Hex String | **Required** (Secret) | **Exactly 64 hex characters (32 bytes)**. Used to encrypt staging credentials and API keys at rest. *Note: Server exits immediately if placeholder key is used in production.* |
| `CORS_ORIGIN` | URL | **Required** | Exact URL of the production web frontend (e.g., `https://app.rankengine.io`) |
| `RATE_LIMIT_WINDOW_MS` | Number | `900000` (15m) | Global request rate limit window size |
| `RATE_LIMIT_MAX` | Number | `200` | Max requests per IP within the global rate limit window |
| `LLM_API_KEY` | String | **Required** (Secret) | Groq API Key |
| `SERP_API_KEY` | String | **Required** (Secret) | SERP API Key |
| `SERP_API_PROVIDER` | String | `serpapi` or `value` | Active SERP API provider |

*Generate `ENCRYPTION_KEY` via shell:*
```bash
node -e "print(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 1.2 Python Background Worker (`/apps/worker`)

| Env Var | Type | Production Requirement | Description |
|---|---|---|---|
| `REDIS_URL` | URL | **Required** (Secret) | Must point to the same Redis instance as the API |
| `MONGODB_URI` | URL | **Required** (Secret) | Must point to the same MongoDB instance as the API |
| `LLM_API_KEY` | String | **Required** (Secret) | Groq API Key for fix-list checklist synthesis |
| `PLAYWRIGHT_HEADLESS` | Boolean | `true` | Runs Playwright in headless mode |
| `SCALE_UP_THRESHOLD` | Number | `10` | Waiting jobs in BullMQ before emitting scale-up signals |
| `SCALE_CHECK_INTERVAL` | Number | `30` | Polling frequency in seconds for queue depth checking |

---

## 2. Worker Pool Deployment & Autoscaling Runbook

The background worker operates in a decoupled fashion from the API server via the BullMQ `crawl-jobs` queue in Redis. Due to the high CPU/memory consumption of headless browser crawling (Playwright/Chromium), it is recommended to scale the Python worker pool independently of the web frontend and API server.

### 2.1 The Autoscaling Signal
The worker contains a built-in background loop that monitors queue depth every 30 seconds. If the count of waiting jobs exceeds `SCALE_UP_THRESHOLD` (default: 10), it prints a clean signal to stdout:
```
SCALE_UP: <job_count> jobs waiting
```

Configure your container metrics collector (such as Datadog, AWS CloudWatch Logs, or Prometheus tailers) to watch for the `SCALE_UP` pattern to trigger horizontal scaling events.

### 2.2 Recommended Replica Sizing (Moderate Traffic)
For a standard moderate-traffic load (10,000 – 50,000 page audits per day):
- **Minimum Worker Replicas**: **2** (maintains high availability during updates and basic parallel crawls).
- **Maximum Worker Replicas**: **8** (caps resource usage and prevents overloading target sites or API limits).
- **Scale-Up Rule**: Spin up 1 new replica when queue depth remains $> 10$ for $> 60$ seconds, up to the maximum limit of 8.
- **Scale-Down Rule**: Spin down 1 replica when queue depth remains at 0 for $> 5$ minutes.

---

## 3. Local Full-Stack Launch via Docker Compose

To test the entire system end-to-end locally using production-ready Docker configurations:

1. Build and boot all containers:
   ```bash
   docker compose up --build
   ```
2. Once booted:
   - **Frontend App**: Accessible at `http://localhost:8080`
   - **Backend API**: Accessible at `http://localhost:3000`
   - **Python Worker API / Health**: Accessible at `http://localhost:8000/health`
3. Shutdown cleanly:
   ```bash
   docker compose down -v
   ```
