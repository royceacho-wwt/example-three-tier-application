# Contributing Checks: Running the API Locally

This guide explains how to run the API locally for development and testing purposes.

## Prerequisites

- [Node.js 22](https://nodejs.org/) or later
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL, or use a local PostgreSQL installation)
- npm (comes with Node.js)

## Option 1: Run Everything with Docker Compose (Recommended)

The simplest way to run the full stack locally:

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port 5432 (internal)
- **Migrations** (runs automatically)
- **API** on port 3001 (internal)
- **Web** on port 3000 (exposed)

The API is accessible internally at `http://api:3001` from other containers.

## Option 2: Run the API Standalone (for Development)

If you want to run just the API outside of Docker for faster iteration:

### 1. Start PostgreSQL

Start only the database container:

```bash
docker compose up postgres -d
```

### 2. Run Database Migrations

```bash
cd src/db
npm install
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up
```

### 3. Start the API

```bash
cd src/api
npm install
DATABASE_URL=postgres://app:app@localhost:5432/app npm run dev
```

The API will start on `http://localhost:3001` with file watching enabled (auto-restart on changes).

For production mode without file watching:

```bash
DATABASE_URL=postgres://app:app@localhost:5432/app npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the API listens on | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | (required) |

Example connection string format:
```
postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

## Verifying the API is Running

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok"}
```

### List Tasks

```bash
curl http://localhost:3001/tasks
```

### Create a Task

```bash
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task"}'
```

### Update a Task

```bash
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

## API Endpoints Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) |
| PATCH | `/tasks/:id` | Update a task (`{ "completed": true }` or `{ "title": "..." }`) |

## Troubleshooting

### "Connection refused" errors

Make sure PostgreSQL is running:

```bash
docker compose ps
```

If postgres isn't running, start it:

```bash
docker compose up postgres -d
```

### "relation 'tasks' does not exist"

Migrations haven't been applied. Run:

```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up
```

### Port already in use

If port 3001 is already in use, set a different port:

```bash
PORT=3002 DATABASE_URL=postgres://app:app@localhost:5432/app npm run dev
```

## Cleaning Up

Stop and remove all containers:

```bash
docker compose down
```

Stop and remove all containers including data:

```bash
docker compose down -v
```
