# Server — Tasks API (NestJS)

REST API for the Tasks app. Part of the monorepo documented in the [root README](../README.md).

## Responsibilities

- Expose CRUD endpoints under **`/api/tasks`** (`GET`, `POST`, `PUT`, `DELETE`).
- Validate request bodies with **class-validator** DTOs (`CreateTaskDto`, `UpdateTaskDto`).
- Persist tasks in a **JSON file** on disk (no database).

## Persistence

- Data file: **`data/tasks.json`** relative to the process **current working directory** (when you run the server from `server/`, that is `server/data/tasks.json`).
- The file is created automatically; the shape is `{ "tasks": [ ... ] }`.
- Writes use a **simple queue lock** so concurrent writes are serialized.
- `data/tasks.json` is **gitignored** (see `.gitignore`) so local data is not committed.

## Module layout

| Area | Role |
|------|------|
| `TasksController` | HTTP routes, maps DTOs to responses |
| `TasksService` | Business logic, normalization |
| `TasksRepository` | Read/write JSON file |

## Prerequisites

- Node.js 20+ recommended
- npm

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
