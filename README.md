# Job Offers Aggregation Service

## Overview

This project is a comprehensive Job Offers Aggregation Service built with NestJS, TypeORM, and PostgreSQL. The service automatically fetches job offers from multiple providers, stores them in a database, and provides a RESTful API for searching and retrieving job offers.

## 🚀 Features

- **Multi-Provider Job Aggregation**
  - Fetch job offers from multiple API sources
  - Automatic data normalization
  - Prevent duplicate job entries

- **Robust API**
  - Pagination support
  - Flexible filtering
  - Swagger documentation

- **Scheduled Job Synchronization**
  - Periodic job offer retrieval
  - Configurable cron job

- **Error Handling**
  - Comprehensive logging
  - Graceful error management

## 🛠 Tech Stack

- **Backend**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **API Documentation**: Swagger
- **Containerization**: Docker
- **Testing**: Jest

## 📦 Prerequisites

- Node.js (v20+)
- Docker
- PostgreSQL

## 🔧 Installation

1. Clone the repository
```bash
git clone https://github.com/MiMmohammdi/job-offers-api
cd job-offers-service
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
- Copy `.env.example` to `.env`
- Update database credentials

## 🐳 Docker Setup

```bash
docker-compose up --build
```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## 📄 API Documentation

Access Swagger Documentation:
- URL: `http://localhost:3000/docs`
- Provides comprehensive API endpoint details

## 🔍 API Endpoints

### Get Job Offers
`GET /api/job-offers`

**Query Parameters**:
- `page`: Page number (default: 1)
- `page_size`: Results per page (default: 10)
- `title`: Filter by job title
- `location`: Filter by location
- `salary`: Filter by salary range
- `company`: Filter by company name

## 🗃 Database Migrations

```bash
# Generate migration
npm run migration:generate

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run test coverage
npm run test:cov
```

## 🔒 Environment Variables

| Variable                 | Description                    | Default   |
|--------------------------|--------------------------------|------------|
| `PORT`                   | Application port               | 3000       |
| `DB_HOST`                | Database host                  | localhost  |
| `DB_PORT`                | Database port                  | 5432       |
| `DB_USERNAME`            | Database username              | postgres   |
| `DB_PASSWORD`            | Database password              | -          |
| `DB_NAME`                | Database name                  | job_offers |
| `CRON_SCHEDULE`          | Cron job schedule              | 0 * * * * *|
| `RATE_LIMIT_TTL`         | Rate limit ttl                 | 6000       |
| `RATE_LIMIT_MAX_REQUEST` | Rate limit req                 | 1000       |



## 🛡 Security

- Always keep dependencies updated
- Use environment variable management
- Implement proper authentication for production

---
