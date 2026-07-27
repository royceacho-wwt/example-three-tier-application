# Contributing

Thank you for your interest in contributing! This guide explains how to run the API and web apps locally for development.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)

## Running the Apps Locally

### 1. Start the Database

Start PostgreSQL and run migrations using Docker Compose:

```bash
docker compose up postgres migrate
```

This starts PostgreSQL on port 5432 and applies database migrations.

### 2. Run the API

```bash
cd src/api
npm install
DATABASE_URL=postgres://app:app@localhost:5432/app npm run dev
```

The API runs on [http://localhost:3001](http://localhost:3001) with hot reloading.

### 3. Run the Web App

In a separate terminal:

```bash
cd src/web
npm install
API_URL=http://localhost:3001 npm run dev
```

The web app runs on [http://localhost:3000](http://localhost:3000) with hot reloading.

## Alternative: Run Everything with Docker Compose

If you prefer not to install Node.js locally:

```bash
docker compose up --build
```

This starts all services (postgres, migrate, api, web) together. Open [http://localhost:3000](http://localhost:3000) when ready.

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reloading (api or web) |
| `npm run lint` | Run ESLint (web only) |
| `npm run build` | Build for production (web only) |
