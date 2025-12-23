# Client — Tasks UI (React + Vite)

Single-page app for the Tasks assignment. Part of the monorepo documented in the [root README](../README.md).

## Stack

- **React 19** and **TypeScript**
- **Vite** for dev server and production builds
- **Tailwind CSS** and **Radix UI**-based primitives (shadcn/ui-style components under `src/components/ui/`)
- **TanStack Virtual** for a virtualized task list
- **Sonner** for toast notifications

ESLint configuration lives in [`eslint.config.js`](eslint.config.js).

## Prerequisites

- Node.js 20+ recommended
- npm
- The **NestJS API** must be running for live data (default `http://localhost:3000`), unless you only build static assets.

## Install

From the repository root (workspaces):

```bash
npm install
```

Or from this directory:

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite serves the app at **`http://localhost:5173`**.

API calls use relative URLs such as `/api/tasks`. In development, Vite **proxies** `/api` to `http://localhost:3000` (see [`vite.config.ts`](vite.config.ts)), so you typically run the backend separately or use `npm run dev` from the repository root.

## Path alias

Imports can use the `@/` prefix, resolved to `src/` (configured in [`vite.config.ts`](vite.config.ts)).

## Project layout (high level)

| Path | Purpose |
|------|---------|
| `src/api/` | API helpers for tasks |
| `src/hooks/` | React hooks (e.g. task data and mutations) |
| `src/components/` | Feature UI (`TaskList`, dialogs, filter bar) and `ui/` primitives |
| `src/types/` | Shared TypeScript types |
| `src/lib/` | Utilities (e.g. `cn` for class names) |

## Build and preview

```bash
npm run build    # typecheck + Vite production build → dist/
npm run preview  # serve dist/ locally
```

## Lint

```bash
npm run lint
npm run lint:fix
```

## API reference

See the [root README](../README.md#api-documentation).
