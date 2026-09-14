# Architecture Guide

This document explains the software architecture, dependency rules, boundary enforcements, and Atomic Design System implemented in this Next.js template.

---

## 1. Directory Structure

```text
src/
├── app/                  # Next.js App Router (pages, layouts, route handlers)
│   ├── (marketing)/      # Public marketing route group
│   ├── (auth)/           # Authentication route group
│   ├── dashboard/        # Authenticated application domain
│   ├── api/              # HTTP API routes (health, webhooks, REST)
│   └── globals.css       # Design tokens & CSS reset
│
├── features/             # Domain features (self-contained modules)
│   ├── authentication/   # Authentication domain
│   └── orders/           # Orders & commerce domain
│       ├── components/   # Feature-specific UI components (domain organisms)
│       ├── actions/      # Next.js Server Actions
│       ├── services/     # Domain business logic & data orchestration
│       ├── schemas/      # Zod validation schemas
│       ├── types/        # Domain TypeScript definitions
│       ├── utils/        # Pure domain calculation utilities
│       ├── __tests__/    # Feature unit & integration tests
│       └── index.ts      # Stable public contract for external consumers
│
├── components/           # Shared Atomic Design presentation layer
│   ├── atoms/            # Indivisible UI units (Button, Input, Badge, Card)
│   ├── molecules/        # 2+ atom combinations with local UI state (Modal, EmptyState)
│   ├── organisms/        # Complex domain-agnostic composite UI blocks (Header, Footer)
│   ├── templates/        # Page layout wireframes & slot orchestration without live backend data
│   ├── layouts/          # Reusable page structural shells
│   ├── ui/               # [Compat] Re-exports atomic primitives
│   └── shared/           # [Compat] Re-exports composite organisms/molecules
│
├── lib/                  # Infrastructure & cross-cutting concerns
│   ├── server/           # Server-only modules (db, secrets, session)
│   ├── client/           # Client-safe utilities (api fetcher, analytics)
│   ├── api/              # API contracts, correlation ID, error handling
│   ├── auth/             # Role-Based Access Control (RBAC) & permissions
│   ├── env/              # Centralized environment variable validation
│   └── logger/           # Structured JSON logger
│
├── config/               # Application-level configuration
├── types/                # Global / cross-cutting type definitions
└── styles/               # Centralized design tokens (tokens.css)
```

---

## 2. Dependency Flow Rules

Dependencies strictly flow downward:

```text
App Router (Pages: src/app)
    ↓
Feature UI (Domain Organisms, Services, Actions: src/features/*)
    ↓
Templates (src/components/templates)
    ↓
Organisms (src/components/organisms)
    ↓
Molecules (src/components/molecules)
    ↓
Atoms (src/components/atoms)
    ↓
Design Tokens (CSS Variables: src/styles/tokens.css)
```

### Prohibited Flows (Enforced by ESLint):

- **Inverted Atomic Flow**: Atoms cannot import Molecules, Organisms, Templates, or Features. Molecules cannot import Organisms, Templates, or Features. Organisms cannot import Templates or Feature domain code.
- **Bypassing Design Tokens**: Hardcoded color hex codes (`#...`) and arbitrary magic-pixel dimensions outside tokens are forbidden in presentation components.
- **Components → Database**: UI components must never access databases, repositories, or server secrets.
- **Client Components → Server Modules**: Files containing `"use client"` cannot import `src/lib/server/*`.
- **Feature A → Feature B internals**: Cross-feature imports must target the feature public contract (`@/features/feature-b`), never internal subpaths.
- **Components UI → Business Logic**: Atomic primitives and shared components must remain purely presentational.

---

## 3. Atomic Design System & Continuous UI Architecture

To prevent visual fragmentation and maintain scalable, continuous UI screens across complex projects:

1. **Tokens (`src/styles/tokens.css`)**: Design tokens represent foundational constants (color, typography, spacing, border radii, shadows, motion). All UI styles MUST consume tokens.
2. **Atoms (`src/components/atoms/`)**: Indivisible UI elements. Purely presentational and stateless (e.g. Button, Input, Badge, Card).
3. **Molecules (`src/components/molecules/`)**: Small functional combinations of 2+ atoms with local, ephemeral UI state (e.g. Modal, EmptyState, FormField). Purely presentational; no domain business rules or network fetches.
4. **Organisms (`src/components/organisms/` & `src/features/**/components/`)**: Standalone, composite UI sections. Global organisms (Header, Footer) live in `src/components/organisms/`. Domain-specific organisms live in their respective feature folder.
5. **Templates (`src/components/templates/`)**: Page wireframe layouts that orchestrate slots (`heroSlot`, `contentSlot`, etc.) and enforce continuous visual rhythm, completely independent of live backend data.
6. **Pages (`src/app/**/page.tsx`)**: Server Component route handlers that fetch data, validate permissions, and assemble Templates and Organisms with real data.

---

## 4. Boundary Validation (Zod)

Every boundary validates untrusted data before processing:

1. **API Requests**: `src/app/api/v1/orders/route.ts` validates payloads via `createOrderSchema`.
2. **Server Actions**: `src/features/orders/actions/order.action.ts` validates arguments with `safeParse`.
3. **Environment Variables**: `src/lib/env/server.ts` and `client.ts` validate environment variables on boot.
