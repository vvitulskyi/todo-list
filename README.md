# SD Solutions Home Assignment — Tasks App

## Overview

A full-stack personal task manager with a NestJS REST API and a React (Vite) frontend focused on clean UX and maintainable architecture.

## Key features

- **CRUD tasks**: create, edit, delete, mark complete/pending
- **Filtering**: all / pending / completed
- **Polished UX**: loading skeletons, error states with retry, toast feedback on actions
- **Accessibility**: labeled inputs, keyboard-friendly dialogs, focus-visible styles
- **Persistence**: tasks stored in a **static JSON file** (no database)
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

---

## Run (development)

### Both apps (recommended)

From the repository root, run the API and the Vite dev server together:

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
- `createdAt: string` (ISO timestamp)
- `updatedAt: string` (ISO timestamp)

> Note: API responses always include `description` and `dueDate` keys (as `null` when not provided).

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

```bash
curl -s -X PUT http://localhost:3000/api/tasks/<id> \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write docs","priority":"medium","status":"completed","description":null,"dueDate":null}'
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
- **Static JSON file**: matches requirements; simplest persistence without DB.
- **class-validator DTOs**: clear input validation and predictable error handling.

**Trade-offs**:
- File-based persistence is not ideal for high concurrency or large datasets; suitable for this assignment scope.

---

## Product decisions

See [`PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md).
