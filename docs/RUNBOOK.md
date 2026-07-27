# Runbook

This runbook summarises how to start, stop, and troubleshoot the three-tier application stack.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

## Starting the Stack

Start all services with a single command:

```bash
docker compose up --build
```

This brings up four services in order:

| Service | Description | Port |
|---------|-------------|------|
| **postgres** | PostgreSQL 17 database | 5432 (internal) |
| **migrate** | Runs database migrations, then exits | — |
| **api** | Express REST API | 3001 (internal) |
| **web** | Next.js frontend | 3000 (exposed) |

Once running, open [http://localhost:3000](http://localhost:3000) in your browser.

## Verifying the Stack

1. **Check running containers:**
   ```bash
   docker compose ps
   ```
   You should see `postgres`, `api`, and `web` running. The `migrate` service exits after completing.

2. **View logs:**
   ```bash
   docker compose logs -f
   ```

3. **Test the web frontend:**
   Open [http://localhost:3000](http://localhost:3000) — you should see the task manager UI.

## Stopping the Stack

```bash
# Stop containers (preserves database data)
docker compose down

# Stop and delete all data (including database)
docker compose down -v
```

## Rebuilding After Code Changes

```bash
docker compose up --build
```

## Common Issues

### Port 3000 already in use

Another process is using port 3000. Stop it or change the port mapping in `docker-compose.yml`.

### Database connection errors

Ensure the `postgres` service is healthy before `api` starts. Check logs:

```bash
docker compose logs postgres
```

### Migrations failed

Check the `migrate` service logs:

```bash
docker compose logs migrate
```

To re-run migrations, restart the stack:

```bash
docker compose down
docker compose up --build
```

## Environment Variables

| Service | Variable | Default | Description |
|---------|----------|---------|-------------|
| postgres | `POSTGRES_DB` | `app` | Database name |
| postgres | `POSTGRES_USER` | `app` | Database user |
| postgres | `POSTGRES_PASSWORD` | `app` | Database password |
| api | `PORT` | `3001` | API server port |
| api | `DATABASE_URL` | `postgres://app:app@postgres:5432/app` | PostgreSQL connection string |
| web | `PORT` | `3000` | Web server port |
| web | `API_URL` | `http://api:3001` | Internal API URL |
