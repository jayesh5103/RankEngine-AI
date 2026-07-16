# RankEngine Worker

A FastAPI Python worker for background crawling and synthesis jobs.

## Development Setup

Prerequisites:
- Python 3.11+
- Poetry

Install dependencies:
```bash
poetry env use python3.11
poetry install
```

Start dev server:
```bash
poetry run uvicorn main:app --reload --port 8000
```
