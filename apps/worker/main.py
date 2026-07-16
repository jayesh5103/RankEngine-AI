from config import settings  # Ensures environment validation executes immediately
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from worker import start_worker, log_json
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background BullMQ Worker
    worker = start_worker()
    yield
    # Shutdown: Close worker connections cleanly
    log_json("INFO", "worker_shutting_down")
    await worker.close()
    log_json("INFO", "worker_shutdown_complete")

app = FastAPI(
    title="RankEngine AI Worker",
    description="Python microservice for background crawling & LLM synthesis jobs",
    version="0.1.0",
    lifespan=lifespan
)

# Enable CORS for local cross-origin queries if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

start_time = time.time()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "rankengine-worker",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "uptime_seconds": round(time.time() - start_time, 2),
        "features": {
            "playwright_crawl": "active_bullmq_worker",
            "llm_synthesis": "pending_implementation"
        }
    }
