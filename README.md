This is a test from Forge AI

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
| PATCH | `/tasks/:id` | Update a task (`{ "completed": true }` or `{ "title": "..." }`) |

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
| `api_image` | Container image URL for the API (e.g., `gcr.io/PROJECT/api:TAG`) |
| `web_image` | Container image URL for the web frontend |
| `region` | GCP region (default: `us-central1`) |
| `db_password` | PostgreSQL password (mark as sensitive) |

### Steps

1. **Build and push images** (example using Artifact Registry):

   ```bash
   gcloud auth configure-docker us-central1-docker.pkg.dev

   # Build and push API
   docker build -t us-central1-docker.pkg.dev/PROJECT_ID/app/api:latest src/api
   docker push us-central1-docker.pkg.dev/PROJECT_ID/app/api:latest

   # Build and push web
   docker build -t us-central1-docker.pkg.dev/PROJECT_ID/app/web:latest src/web
   docker push us-central1-docker.pkg.dev/PROJECT_ID/app/web:latest
   ```

2. **Configure Terraform variables**:

   ```bash
   cd src/infrastructure
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Deploy**:

   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Run migrations** (one-time or after schema changes):

   The migration job is defined in `migration.tf`. To trigger it:

   ```bash
   gcloud run jobs execute db-migrate --region=us-central1
   ```

5. **Access the app**:

   Terraform outputs the `web_url`. Open it in your browser.

### Cleanup

```bash
terraform destroy
```

## Development

### Adding a migration

```bash
cd src/db
npm run migrate create my-migration-name
# Edit the new file in migrations/
```

Then rebuild the migrate service:

```bash
docker compose up --build migrate
```

### Environment variables

| Service | Variable | Description |
|---------|----------|-------------|
| api | `PORT` | API server port (default: 3001) |
| api | `DATABASE_URL` | PostgreSQL connection string |
| web | `PORT` | Web server port (default: 3000) |
| web | `API_URL` | Internal URL to the API (e.g., `http://api:3001`) |

## License

MIT