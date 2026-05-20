# English Learning Platform - Crawler Service

A standalone Python crawler service for extracting vocabulary, grammar, and quiz data from various sources.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRAWLER SERVICE (Python)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │  Source   │───▶│   Fetcher    │───▶│  Parser/Extractor   │   │
│  │ (APIs,    │    │ (httpx,      │    │ (BeautifulSoup,     │   │
│  │  websites)│    │  playwright) │    │  JSON)              │   │
│  └──────────┘    └──────────────┘    └──────────┬──────────┘   │
│                                                  │              │
│                                                  ▼              │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │ REST API │◀───│  Pipeline     │◀───│  Transformer        │   │
│  │ (FastAPI)│    │  (Normalize)  │    │  (Map to Schema)    │   │
│  └────┬─────┘    └──────────────┘    └─────────────────────┘   │
│       │                                                         │
└───────┼─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                              │
├─────────────────────────────────────────────────────────────────┤
│  REST APIs ◀── CRUD operations ◀── Admin Dashboard              │
│  BullMQ Queue ◀── Background Jobs                               │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Vocabulary Crawling**: Extract from Free Dictionary API, Oxford Learner's Dictionary
- **Grammar Crawling**: Extract grammar lessons from various sources
- **Data Pipeline**: Normalize, deduplicate, and enrich crawled data
- **Rate Limiting**: Respectful crawling with configurable delays
- **Async Processing**: Fast concurrent crawling with httpx/asyncio
- **Browser Automation**: Playwright support for JavaScript-rendered pages
- **REST API**: FastAPI-based API for triggering crawls
- **Docker Ready**: Easy deployment with Docker/Docker Compose

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Clone and setup:**

```bash
cd crawler-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\Activate  # Windows

# Install dependencies
pip install -e ".[dev]"
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Run the service:**

```bash
uvicorn src.main:app --reload --port 8000
```

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f crawler

# Stop
docker-compose down
```

## API Endpoints

### Health & Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/stats` | Crawler statistics |
| GET | `/api/v1/sources` | List available sources |

### Vocabulary Crawling

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/crawl/vocabulary` | Queue vocabulary crawl (async) |
| POST | `/api/v1/crawl/vocabulary/sync` | Crawl vocabulary (sync) |
| POST | `/api/v1/crawl/word` | Crawl single word |

### Grammar Crawling

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/crawl/grammar` | Queue grammar crawl (async) |
| POST | `/api/v1/crawl/grammar/sync` | Crawl grammar (sync) |

### Job Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/jobs` | List all jobs |
| GET | `/api/v1/jobs/{job_id}` | Get job status |

## API Examples

### Crawl Vocabulary (Sync)

```bash
curl -X POST http://localhost:8000/api/v1/crawl/vocabulary/sync \
  -H "Content-Type: application/json" \
  -d '{
    "words": ["hello", "world", "computer"],
    "source": "free_dictionary",
    "push_to_backend": false
  }'
```

### Crawl Single Word

```bash
curl -X POST http://localhost:8000/api/v1/crawl/word \
  -H "Content-Type: application/json" \
  -d '{
    "word": "beautiful",
    "source": "free_dictionary"
  }'
```

### Queue Async Job

```bash
curl -X POST http://localhost:8000/api/v1/crawl/vocabulary \
  -H "Content-Type: application/json" \
  -d '{
    "words": ["hello", "world"],
    "source": "free_dictionary"
  }'
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | Environment (development/production) |
| `LOG_LEVEL` | `INFO` | Logging level |
| `API_PORT` | `8000` | API server port |
| `BACKEND_API_URL` | `http://localhost:3001` | NestJS backend URL |
| `CRAWL_DELAY_MIN` | `1.0` | Min delay between requests (seconds) |
| `CRAWL_DELAY_MAX` | `3.0` | Max delay between requests (seconds) |
| `CRAWL_MAX_RETRIES` | `3` | Max retry attempts |
| `CRAWL_TIMEOUT` | `30` | Request timeout (seconds) |
| `CRAWL_CONCURRENCY` | `5` | Max concurrent requests |

## Project Structure

```
crawler-service/
├── config/                 # Configuration
│   ├── settings.py        # App settings (Pydantic)
│   └── sources.py         # Crawl source definitions
├── src/
│   ├── adapters/          # External integrations
│   │   ├── http/          # HTTP client (httpx)
│   │   ├── parsers/       # HTML/JSON parsers
│   │   └── storage/       # Backend API client
│   ├── extractors/        # Data extractors
│   │   ├── base_extractor.py
│   │   ├── vocabulary/    # Vocabulary extractors
│   │   └── grammar/       # Grammar extractors
│   ├── models/            # Pydantic models
│   ├── pipelines/         # Data processing pipelines
│   ├── services/          # Business logic
│   └── main.py            # FastAPI app
├── tests/                 # Unit tests
├── docker-compose.yml      # Docker Compose
├── Dockerfile             # Docker build
├── pyproject.toml         # Python dependencies
└── .env.example          # Environment template
```

## Supported Sources

### Vocabulary

| Source | Type | Rate Limit | Browser Required |
|--------|------|------------|-----------------|
| Free Dictionary API | REST API | 0.5s | No |
| Oxford Learner's | Web | 2.0s | Yes |
| Cambridge Dictionary | Web | 1.5s | No |

### Grammar

| Source | Type | Rate Limit | Browser Required |
|--------|------|------------|-----------------|
| English Grammar Online | Web | 2.0s | Yes |

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src tests/

# Run specific test file
pytest tests/extractors/test_vocabulary.py
```

## License

MIT
