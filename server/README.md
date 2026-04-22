# Server — Tasks API (NestJS)

REST API for the Tasks app. Part of the monorepo documented in the [root README](../README.md).

## Responsibilities

- Expose CRUD endpoints under **`/api/tasks`** (`GET`, `POST`, `PUT`, `DELETE`).
- Expose **`POST /api/ai/breakdown/:taskId`** (AI subtasks with semantic context via pgvector).
- Expose **`POST /api/ai/suggest-plan`** (AI day plan for pending tasks).
- Validate request bodies with **class-validator** DTOs (`CreateTaskDto`, `UpdateTaskDto`).
- Persist tasks, embeddings, and task history in **PostgreSQL** with the `pgvector` extension.

## Persistence

- **PostgreSQL** (pgvector/pgvector:pg16) — start with `docker compose up -d` from the repo root.
- Connection string is read from `DATABASE_URL` env var (see [`.env.example`](.env.example)).
- Migrations run automatically on server start via [`src/database/migrations/001_init.sql`](src/database/migrations/001_init.sql). The migration is idempotent (`CREATE TABLE IF NOT EXISTS`).
- The `tasks` table includes an `embedding vector(1536)` column populated on every create/update using `text-embedding-3-small`.
- A separate `task_history` table records `created` / `updated` / `completed` events used as AI context.

## AI / environment

- Inference uses **GitHub Models** via `GITHUB_TOKEN` (see [root README environment section](../README.md#environment-variables) and [`server/.env.example`](.env.example)).

## Module layout

| Area | Role |
|------|------|
| `TasksController` | HTTP routes for CRUD, maps DTOs to responses |
| `TasksService` | Business logic: create/update/delete tasks, generate embeddings |
| `TasksRepository` | Read/write PostgreSQL (tasks, history, vector similarity search) |
| `AiController` | AI endpoints: `suggest-plan` and `breakdown/:taskId` (orchestrates AI + task read/write) |
| `AiService` | LLM interactions: breakdown and suggest-plan with Zod validation and retry |
| `EmbeddingService` | Generates `text-embedding-3-small` vectors via GitHub Models |
| `LLMClient` | Injectable OpenAI client pointed at `https://models.github.ai/inference` |
| `DatabaseModule` | Provides `pg.Pool` with auto-migration on startup |

## Prerequisites

- Node.js 20+ recommended
- npm
- Docker (for PostgreSQL with pgvector)

## Install

From the repository root (workspaces):

```bash
npm install
```

Or from this directory:

```bash
npm install
```

## Run

Development (watch):

```bash
npm run start:dev
```

The app listens on **`http://localhost:3000`**.

Production build and run:

```bash
npm run build
npm run start:prod
```

## Tests

```bash
npm run test          # unit tests
npm run test:e2e      # e2e tests
npm run test:cov      # coverage
```

## Lint

```bash
npm run lint
npm run lint:fix
```

## API reference

HTTP methods, request/response shapes, and **curl** examples are maintained in the [root README](../README.md#api-documentation) so they stay in one place.

## Further reading

- [NestJS documentation](https://docs.nestjs.com/)
