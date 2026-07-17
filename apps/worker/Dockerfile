# Production build for Playwright-backed Python Worker
FROM python:3.11-slim

WORKDIR /app

# Install system utilities and curl for dependency management
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install poetry for lockfile resolution
RUN pip install --no-cache-dir poetry

# Configure poetry to link package dependencies globally inside the container
RUN poetry config virtualenvs.create false

# Copy lockfile definitions
COPY apps/worker/pyproject.toml apps/worker/poetry.lock ./

# Install python dependencies
RUN poetry install --no-root --no-interaction --no-ansi

# Install Playwright browser binaries and all required OS system libraries for headless Chromium
RUN playwright install --with-deps chromium

# Copy application files
COPY apps/worker/ ./

EXPOSE 8000

# Start Uvicorn to run health endpoints (lifespan initiates worker & monitors)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
