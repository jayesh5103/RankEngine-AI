# Production build for Python Worker using official Playwright pre-built image
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

WORKDIR /app

# Install poetry for lockfile dependency resolution
RUN pip install --no-cache-dir poetry

# Configure poetry to link packages globally inside the container
RUN poetry config virtualenvs.create false

# Copy lockfile definitions
COPY apps/worker/pyproject.toml apps/worker/poetry.lock ./

# Install python dependencies
RUN poetry install --no-root --no-interaction --no-ansi

# Copy application files
COPY apps/worker/ ./

EXPOSE 8000

# Start Uvicorn to run health endpoints (lifespan initiates worker & monitors)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
