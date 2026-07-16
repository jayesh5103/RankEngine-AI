from config import settings  # Ensures environment validation executes immediately
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI(
    title="RankEngine AI Worker",
    description="Python microservice for background crawling & LLM synthesis jobs",
    version="0.1.0"
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
            "playwright_crawl": "pending_implementation",
            "llm_synthesis": "pending_implementation"
        }
    }
