# example-three-tier-application

A reference implementation of a three-tier web application: a Next.js frontend, an Express REST API, and a PostgreSQL database. It runs locally with Docker Compose and deploys to Google Cloud Platform (Cloud Run + Cloud SQL) via Terraform.

## Architecture

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | Next.js 16, React 19, Tailwind CSS | `src/web/` |
| API | Express 5, Node.js 22 | `src/api/` |
| Database | PostgreSQL 17 | managed by Docker / Cloud SQL |
| Migrations | node-pg-migrate | `src/db/` |
| Infrastructure | Terraform (GCP) | `src/infrastructure/` |

The app is a simple task manager (to-do list) that demonstrates how the three tiers communicate.

## Running locally with Docker Compose

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### Start the stack

```bash
docker compose up --build
```

This starts four services in order:

1. **postgres** — PostgreSQL 17 database, waits until healthy
2. **migrate** — runs `node-pg-migrate up` to apply schema migrations, then exits
3. **api** — Express API on port 3001 (internal only)
4. **web** — Next.js frontend on port 3000 (exposed to host)

Once running, open [http://localhost:3000](http://localhost:3000).

### Stop and clean up

```bash
# Stop containers (keeps the postgres_data volume)
docker compose down

# Stop and delete all data
docker compose down -v
```

### Rebuild after code changes

```bash
docker compose up --build
```

### API endpoints

The API is not exposed directly, but you can reach it through the web container or by temporarily mapping its port:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) |
| PATCH | `/tasks/:id` | Update a task: toggle completion with `{ "completed": true }` or rename with `{ "title": "New name" }` |

#### PATCH /tasks/:id

Updates an existing task. You can provide one or both fields:

- **`completed`** (boolean) — marks the task as complete or incomplete
- **`title`** (string) — renames the task

**Examples:**

```bash
# Toggle completion
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Rename a task
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'

# Update both at once
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true, "title": "Buy groceries"}'
```

Returns 404 if the task ID does not exist.

### Health endpoint

The `/health` endpoint provides a simple way to verify that the API service is running and responsive. It returns a JSON response with HTTP status 200:

```json
{ "status": "ok" }
```

This endpoint is useful for:
- **Container orchestration**: Docker Compose and Kubernetes can use it for liveness/readiness probes
- **Load balancers**: Cloud Run and other load balancers can check service health before routing traffic
- **Monitoring**: External monitoring tools can poll this endpoint to detect outages

The health check does not verify database connectivity—it only confirms the Express server is accepting requests.

## Frontend Features

The Next.js frontend provides an interactive task management interface with the following capabilities:

- **Add tasks** — Use the input field at the top to create new tasks
- **Toggle completion** — Click the checkbox next to any task to mark it complete or incomplete
- **Inline rename** — Click the "Rename" button next to any task to edit its title. The interface provides:
  - A text input with the current title pre-filled
  - "Save" button to commit the change
  - "Cancel" button to discard edits
  - Keyboard shortcuts: **Enter** to save, **Escape** to cancel
- **Responsive design** — The UI adapts to light and dark mode based on system preferences
- **Real-time updates** — All interactions use client-side state management to provide immediate feedback

The frontend communicates with the API through server actions defined in `src/web/app/actions.ts`.

## Contributing

For detailed instructions on running the API locally for development, see [docs/CONTRIBUTING-CHECKS.md](docs/CONTRIBUTING-CHECKS.md).

## Project structure

```
src/
├── api/            # Express REST API
│   ├── index.js    # Route handlers
│   ├── db.js       # PostgreSQL connection pool
│   └── Dockerfile
├── db/             # Database migrations
│   ├── migrations/ # node-pg-migrate migration files
│   └── Dockerfile
├── web/            # Next.js frontend
│   ├── app/        # App Router pages and components
│   └── Dockerfile
└── infrastructure/ # Terraform for GCP deployment
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

## Deploying to GCP

The `src/infrastructure/` directory contains Terraform that provisions:

- VPC network and subnet
- Cloud SQL PostgreSQL 17 instance (private IP)
- Cloud Run services for the API and web frontend
- Secret Manager secret for the database URL
- Service accounts and IAM bindings

### Required variables

| Variable | Description |
|----------|-------------|
| `project_id` | GCP project ID |
| `api_image` | Container image URI for the API (e.g. `gcr.io/PROJECT/api:TAG`) |
| `web_image` | Container image URI for the web frontend |
| `region` | GCP region (default: `us-central1`) |
| `environment` | `dev`, `staging`, or `prod` (default: `dev`) |

```bash
cd src/infrastructure
terraform init
terraform apply -var="project_id=my-project" \
                -var="api_image=gcr.io/my-project/api:latest" \
                -var="web_image=gcr.io/my-project/web:latest"
```

After apply, `terraform output web_url` gives the public URL.

## Database migrations

Migrations live in `src/db/migrations/` and use [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

```bash
# Apply all pending migrations (run inside the db container or with DATABASE_URL set)
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up

# Roll back the last migration
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate down
```

When running via Docker Compose the `migrate` service handles this automatically on startup.

<!-- forge merge-strategy probe -->
