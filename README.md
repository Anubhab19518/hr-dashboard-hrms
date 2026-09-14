# Next.js Production Template

A scalable, maintainable, production-ready frontend template built with **Next.js App Router (v16.3)**, **React 19**, and **TypeScript (Strict Mode)**.

Strictly engineered according to the 80 engineering rules in [`AGENTS.md`](./AGENTS.md).

---

## Key Features

- **Strict Architecture Boundaries**: Features own their domain (`components`, `actions`, `services`, `schemas`, `types`, `utils`, `tests`). Automated lint enforcement via `eslint-plugin-boundaries`.
- **Zero `any` & No `@ts-ignore`**: Strict TypeScript typing across the entire codebase.
- **Server by Default**: React Server Components by default with client interactivity isolated behind explicit boundaries.
- **Server/Client Isolation**: Server-only secrets and database repositories protected via compile-time `server-only` checks.
- **Structured JSON Logging**: Centralized logger with request correlation (`x-request-id`) and automatic sensitive-data scrubbing (`no-console` enforced).
- **Runtime Validation**: Zod schema validation across external boundaries (API routes, server actions, environment variables).
- **Containerized Reproducibility**: Multi-stage Dockerfile (`node:22-alpine`) with non-root security, pnpm lockfile, and healthcheck probes.
- **Comprehensive Quality Suite**: Vitest (unit & integration tests with >= 80% coverage benchmark), Playwright E2E smoke tests, Husky, lint-staged, and Conventional Commits.

---

## Quick Start

### Prerequisites

- Node.js `>= 22.0.0`
- pnpm `>= 10.0.0`

### 1. Installation

```bash
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Running Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the template.

---

## Available Scripts

| Command              | Description                                                      |
| :------------------- | :--------------------------------------------------------------- |
| `pnpm dev`           | Starts local Next.js development server                          |
| `pnpm build`         | Compiles optimized production standalone bundle                  |
| `pnpm start`         | Starts production server from standalone output                  |
| `pnpm typecheck`     | Validates TypeScript in strict mode (`tsc --noEmit`)             |
| `pnpm lint`          | Runs strict ESLint with architectural boundary validation        |
| `pnpm lint:fix`      | Automatically fixes auto-fixable lint issues                     |
| `pnpm format:check`  | Checks formatting with Prettier                                  |
| `pnpm format:write`  | Formats all source files with Prettier                           |
| `pnpm test`          | Runs unit and integration test suite via Vitest                  |
| `pnpm test:coverage` | Runs tests and validates >= 80% coverage thresholds              |
| `pnpm test:e2e`      | Runs Playwright E2E smoke test suite                             |
| `pnpm validate`      | Full pre-push verification: typecheck, lint, coverage, and build |

---

## Docker & Containerization

### Build Production Image

```bash
docker build -t nextjs-app:latest .
```

### Run Production Container

```bash
docker run -p 3000:3000 nextjs-app:latest
```

### Docker Compose

```bash
# Production container
docker compose up app

# Development container with hot-reload
docker compose --profile dev up app-dev
```

---

## Architecture & Boundaries

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for architectural layers, dependency flow, and boundary rules.
See [`AGENTS.md`](./AGENTS.md) for the mandatory 80 engineering rules.
