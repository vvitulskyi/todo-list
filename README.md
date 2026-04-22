# Tasks App

## Overview

A full-stack personal task manager with a NestJS REST API and a React (Vite) frontend focused on clean UX and maintainable architecture.

## Key features

- **CRUD tasks**: create, edit, delete, mark complete/pending
- **Subtasks**: structured checklist per task (`id`, `title`, `done`), AI-generated via breakdown or updated via the API
- **AI assistance** (GitHub Models): **Suggest plan** (ordered pending tasks with reasons) and **Breakdown** (subtasks with optional clarification flow)
- **Filtering**: all / pending / completed
- **Polished UX**: loading skeletons, error states with retry, toast feedback on actions, global UI lock while AI requests run
- **Accessibility**: labeled inputs, keyboard-friendly dialogs, focus-visible styles
- **Persistence**: tasks and append-only **task history** stored in **PostgreSQL** with **pgvector** for semantic similarity search
- **Performance**: task list uses **virtualization** (renders only visible rows)

## Project structure

- [`server/`](server/) — NestJS backend (`GET/POST/PUT/DELETE /api/tasks`). Details: [server/README.md](server/README.md).
- [`client/`](client/) — Vite + React + TypeScript frontend (Tailwind + shadcn/ui-style components). Details: [client/README.md](client/README.md).

This repository uses **npm workspaces** (`client` and `server` are declared in the root [`package.json`](package.json)).

---

## Setup & installation

### Prerequisites

- Node.js 20+ recommended
- npm
- **Docker** (to run PostgreSQL with pgvector via `docker-compose.yml`)
- **GitHub personal access token** with permission to use **GitHub Models** (see [Environment variables](#environment-variables))

### Install dependencies

From the repository root (installs all workspaces):

```bash
npm install
```

Alternatively, install each package on its own:

```bash
cd server && npm install
```

```bash
cd client && npm install
```

### Start PostgreSQL

The server requires PostgreSQL 16 with the `pgvector` extension. Start it with Docker:

```bash
docker compose up -d
```

This starts `pgvector/pgvector:pg16` on port `5432` with the `tasks_ai` database (credentials in [`docker-compose.yml`](docker-compose.yml)). Migrations run automatically on the first server start.

### Environment variables

AI features call **[GitHub Models](https://github.com/marketplace/models)** through the OpenAI-compatible endpoint `https://models.github.ai/inference`. The server reads env vars from `server/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes (AI) | A GitHub **personal access token (classic)** or fine-grained token with access to GitHub Models inference. The Nest app passes this value as the OpenAI client `apiKey` (see [`server/src/ai/llm/llm.client.ts`](server/src/ai/llm/llm.client.ts)). |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Default matches `docker-compose.yml`: `postgres://postgres:postgres@localhost:5432/tasks_ai` |
| `PORT` | No | HTTP port for the API (default `3000`). |

**Setup:**

1. Copy the example file and fill in your values:

   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env`:
   - Set `GITHUB_TOKEN` to a valid token.
   - Set `DATABASE_URL` (default value matches the Docker Compose setup, no change needed if using Docker).

3. Do not commit `.env` (it is gitignored).

Without `GITHUB_TOKEN`, task CRUD still works; **Suggest plan** and **Breakdown** will fail when the backend calls the model.

---

## Run (development)

### Both apps (recommended)

Make sure PostgreSQL is running (`docker compose up -d`), then from the repository root run the API and the Vite dev server together:

```bash
npm run dev
```

Other root shortcuts:

- `npm run dev:server` — backend only
- `npm run dev:client` — frontend only

### Start backend only

```bash
cd server
npm run start:dev
```

Server listens on `http://localhost:3000`.

### Start frontend only

```bash
cd client
npm run dev
```

Vite serves on `http://localhost:5173` and proxies `/api/*` to `http://localhost:3000` (see [`client/vite.config.ts`](client/vite.config.ts)).

---

## API documentation

Base URL: `http://localhost:3000`

### Data model

Each task includes:

- `id: string`
- `title: string` (required)
- `description: string | null`
- `priority: "high" | "medium" | "low"`
- `dueDate: string | null` (format `YYYY-MM-DD`)
- `status: "pending" | "completed"`
- `subTasks: Array<{ id: string; title: string; done: boolean }> | null`
- `createdAt: string` (ISO timestamp)
- `updatedAt: string` (ISO timestamp)

Tasks are persisted in PostgreSQL. The `tasks` table also stores a **`embedding`** column (`vector(1536)`) generated via `text-embedding-3-small` on create/update — used for semantic similarity search during AI breakdown.

A separate **`task_history`** table records `{ taskId, action: "created" | "updated" | "completed", timestamp }` events used as context for AI breakdown (not exposed as a REST resource). Migrations run automatically on server start via [`server/src/database/migrations/001_init.sql`](server/src/database/migrations/001_init.sql).

> Note: API responses always include `description`, `dueDate`, and `subTasks` keys (as `null` or empty array semantics per endpoint when not set).

### Endpoints

#### GET `/api/tasks`
Returns an array of tasks.

```bash
curl -s http://localhost:3000/api/tasks
```

#### POST `/api/tasks`
Create a new task.

Request body:

- `title` (required)
- `priority` (required)
- `description` (optional)
- `dueDate` (optional, `YYYY-MM-DD`)
- `status` (optional, defaults to `pending`)

```bash
curl -s -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write docs","priority":"high","dueDate":"2026-12-31"}'
```

#### PUT `/api/tasks/:id`
Full update (replace) of a task (the backend expects a full DTO).

Request body (required):

- `title`
- `priority`
- `status`

Optional:

- `description`
- `dueDate`
- `subTasks` — full list of subtask objects when updating checklist state

```bash
curl -s -X PUT http://localhost:3000/api/tasks/<id> \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write docs","priority":"medium","status":"completed","description":null,"dueDate":null}'
```

#### POST `/api/ai/breakdown/:taskId`

Runs AI breakdown for the task: returns either `{ "status": "needs_clarification", "questions": string[] }` or the updated task with persisted `subTasks`. Uses semantic similarity search (pgvector) to include related tasks as context.

```bash
curl -s -X POST http://localhost:3000/api/ai/breakdown/<id>
```

#### POST `/api/ai/suggest-plan`

Returns an ordered list of pending tasks with AI-generated reasons. Request body is empty.

```bash
curl -s -X POST http://localhost:3000/api/ai/suggest-plan
```

#### DELETE `/api/tasks/:id`
Deletes a task. Returns `204 No Content`.

```bash
curl -i -X DELETE http://localhost:3000/api/tasks/<id>
```

### Errors

- `400` — validation error (DTO validation)
- `404` — task not found

---

## Scripts & commands

### Root (workspace)

```bash
npm run dev              # backend + frontend (concurrently)
npm run dev:server       # backend only
npm run dev:client       # frontend only
npm run lint
npm run lint:fix
npm run lint:server
npm run lint:client
```

### Server (`server/package.json`)

- `npm run start:dev` — dev server (watch)
- `npm run build` — build
- `npm run lint` / `npm run lint:fix`
- `npm run test` / `npm run test:e2e`

### Client (`client/package.json`)

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run lint` / `npm run lint:fix`

---

## Technology choices, reasoning & trade-offs

### Frontend
- **React + Vite + TypeScript**: fast dev experience, type safety, simple build pipeline.
- **Tailwind + shadcn/ui-style components**: consistent UI, accessible primitives, low styling overhead.
- **TanStack Virtual**: virtualized list rendering for long task lists.

**Trade-offs**:
- Virtualization adds complexity (measuring dynamic heights) but keeps UI responsive for large lists.

### Backend
- **NestJS**: structured modules/controllers/services, built-in DI, great for clean architecture.
- **PostgreSQL + pgvector**: reliable relational persistence with vector similarity search (`<->` operator) for semantic context retrieval during AI breakdown.
- **EmbeddingService**: generates `text-embedding-3-small` vectors via GitHub Models on every task create/update; stored in the `embedding vector(1536)` column.
- **AI module**: layered design (`LLMClient` as injectable, `response_format: json_object`, Zod-validated responses for both breakdown and suggest-plan, retry loop scoped to LLM calls only, context builder for “mini-RAG” over tasks + history).
- **GitHub Models**: OpenAI SDK with `baseURL` `https://models.github.ai/inference` and `GITHUB_TOKEN` as the API key.
- **class-validator DTOs**: clear input validation and predictable error handling.

**Trade-offs**:
- Requires Docker/PostgreSQL; adds operational overhead compared to file-based storage, but enables vector search and proper concurrency handling.
- AI quality and availability depend on GitHub Models and a valid `GITHUB_TOKEN`.

---

## Agent log

See [`AGENT_LOG.md`](AGENT_LOG.md).
