# AGENTS.md

# Next.js Production Engineering Rules

> **Purpose:** This document defines the mandatory architectural,
> coding, testing, security, performance, Docker, Git, and review rules
> for this Next.js codebase.
>
> **Audience:** Human developers, reviewers, CI systems, and AI coding
> agents.
>
> **Principle:** The repository must make good architecture easy and bad
> architecture difficult.

------------------------------------------------------------------------

## 1. Core Engineering Principles

All code in this repository MUST follow these principles:

1.  **Type safety over convenience.**
2.  **Server by default; client only when required.**
3.  **Features own their domain behavior.**
4.  **UI components must not become business-logic containers.**
5.  **Dependencies must flow in one direction.**
6.  **Infrastructure must never leak into presentation.**
7.  **Validate data at system boundaries.**
8.  **Prefer composition over inheritance.**
9.  **Prefer explicit code over clever abstractions.**
10. **Do not introduce abstractions before they are justified.**
11. **Do not duplicate business rules.**
12. **Do not bypass lint, type checking, tests, architecture checks, or
    security checks.**
13. **Every production error must be observable without exposing
    internal details to users.**
14. **Performance, accessibility, security, and responsive behavior are
    engineering requirements---not post-development polish.**
15. **Every dependency must have a reason to exist.**

When uncertain, prefer the simplest design that preserves the
architecture.

------------------------------------------------------------------------

# 2. Mandatory Technology Baseline

The project MUST use:

-   Next.js App Router
-   TypeScript with strict mode
-   ESLint
-   Prettier
-   Husky
-   lint-staged
-   Conventional Commits
-   Unit/integration testing
-   Playwright for critical E2E workflows
-   Docker for reproducible environments
-   A lockfile committed to Git
-   A pinned package-manager version
-   A supported Node.js LTS version

Do not introduce another framework, router, state manager, validation
library, HTTP client, UI library, testing framework, or build system
without architectural approval.

------------------------------------------------------------------------

# 3. Source-of-Truth Rules

Before modifying code, an agent/developer MUST inspect:

1.  `package.json`
2.  `tsconfig.json`
3.  ESLint configuration
4.  Prettier configuration
5.  Docker configuration
6.  Existing feature structure
7.  Existing tests
8.  Existing shared components
9.  Existing API/data-fetching patterns
10. Existing authentication/authorization mechanisms

Never create a parallel implementation when an established repository
pattern already exists.

------------------------------------------------------------------------

# 4. Required Project Structure

The preferred architecture is feature-oriented with an Atomic Design System presentation layer.

``` text
src/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── dashboard/
│   ├── api/
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── not-found.tsx
│   └── globals.css
│
├── features/
│   ├── authentication/
│   ├── customers/
│   ├── orders/
│   ├── products/
│   └── billing/
│
├── components/
│   ├── atoms/         # Indivisible UI units (Button, Input, Badge, Card, Icon)
│   ├── molecules/     # 2+ atom combinations with local UI state (Modal, EmptyState, FormField)
│   ├── organisms/     # Complex domain-agnostic composite UI blocks (Header, Footer, DataTable)
│   ├── templates/     # Page layout wireframes & slot orchestration without live backend data
│   ├── layouts/       # Persistent structural shells
│   ├── ui/            # [Compat] Re-exports atomic primitives
│   └── shared/        # [Compat] Re-exports composite organisms/molecules
│
├── lib/
│   ├── server/
│   ├── client/
│   ├── api/
│   ├── auth/
│   ├── cache/
│   ├── db/
│   ├── env/
│   └── logger/
│
├── hooks/
├── providers/
├── config/
├── types/
└── styles/
```

The exact structure may evolve, but dependency boundaries MUST remain
intact.

------------------------------------------------------------------------

# 5. Architectural Dependency Direction

Dependencies MUST flow downward toward lower-level concerns.

Preferred:

``` text
App Router (Pages)
    ↓
Feature UI (Domain Organisms, Actions, Services)
    ↓
Templates (Wireframe layouts & slot orchestration)
    ↓
Organisms (Complex composite UI sections)
    ↓
Molecules (Functional groupings of atoms)
    ↓
Atoms (Indivisible UI primitives)
    ↓
Design Tokens (CSS Variables: Color, Spacing, Typography, Radii, Shadows, Motion)
    ↓
Infrastructure (DB, Clients, Secrets)
```

UI must NOT directly access infrastructure.

### Forbidden

``` text
Component → Database
Component → Secrets
Component → Repository
Client Component → Server-only module
UI → Infrastructure
Feature A → Feature B's internal implementation
Atom → Molecule / Organism / Template / Feature / App
Molecule → Organism / Template / Feature / App
Organism (Shared) → Template / Feature domain logic / App
Template → Feature domain logic / App
UI Component → Raw hardcoded hex colors / arbitrary magic-pixel spacing (bypassing Design Tokens)
```

### Allowed

``` text
Page → Feature public API
Page → Template public API
Feature → Shared infrastructure
Feature A → Feature B public contract
Template → Organisms / Molecules / Atoms / Layouts
Organism → Molecules / Atoms / other Organisms
Molecule → Atoms / other Molecules
Atom → other Atoms (e.g. Icon primitive in Button)
All UI Components → Design Tokens (CSS Variables)
```

Features MUST expose stable public interfaces instead of allowing
consumers to import arbitrary internal files. Atomic design hierarchy
MUST NOT be inverted.

------------------------------------------------------------------------


# 6. Feature Boundary Rules

Each feature owns its:

-   components
-   schemas
-   types
-   services
-   actions
-   hooks
-   utilities
-   tests
-   domain-specific business rules

Example:

``` text
features/orders/
├── components/
├── actions/
├── services/
├── schemas/
├── types/
├── utils/
└── __tests__/
```

Do NOT place order-specific business logic in:

``` text
components/
hooks/
lib/
utils/
```

unless it is genuinely shared by multiple domains.

A utility used by only one feature belongs to that feature.

------------------------------------------------------------------------

# 7. Shared Code Rules

Shared code MUST meet at least one of these criteria:

-   Used by multiple features.
-   Represents an application-wide concern.
-   Is part of the design system.
-   Is infrastructure used throughout the application.

Do NOT move code into `shared`, `utils`, or `lib` merely because the
file is inconveniently located.

Avoid:

``` text
utils.ts
helpers.ts
common.ts
misc.ts
```

as dumping grounds.

Prefer intention-revealing modules:

``` text
format-currency.ts
normalize-phone-number.ts
build-pagination-query.ts
```

------------------------------------------------------------------------

# 8. Server Components Are the Default

Every component MUST be a Server Component unless it requires
client-side behavior.

Do NOT add:

``` tsx
"use client";
```

without a concrete reason.

Valid reasons include:

-   `useState`
-   `useReducer`
-   browser APIs
-   event handlers
-   client-only libraries
-   interactive UI state

Invalid reasons include:

-   "This component is reusable."
-   "This is a page."
-   "The API call is easier."
-   "The developer usually uses client components."
-   "The component contains JSX."

When client behavior is required, isolate the smallest possible subtree
behind a Client Component boundary.

------------------------------------------------------------------------

# 9. Server/Client Boundary

Client Components MUST NOT import:

-   database clients
-   server secrets
-   server-only services
-   private API credentials
-   filesystem APIs
-   server-only modules

Server-only modules MUST be explicitly separated from client-safe
modules.

Recommended:

``` text
lib/
├── server/
│   ├── auth.ts
│   ├── db.ts
│   └── secrets.ts
│
└── client/
    ├── api.ts
    └── analytics.ts
```

Never expose secrets through `NEXT_PUBLIC_*`.

Treat every `NEXT_PUBLIC_*` value as public.

------------------------------------------------------------------------

# 10. TypeScript Rules

TypeScript MUST run in strict mode.

Avoid:

``` ts
any
```

unless there is a documented and justified boundary case.

Forbidden shortcuts:

``` ts
// @ts-ignore
// @ts-nocheck
as any
```

These require explicit architectural justification and MUST NOT be used
to silence legitimate errors.

Prefer:

``` ts
unknown
```

followed by validation/narrowing.

Prefer discriminated unions over ambiguous object shapes.

Prefer explicit domain types over repeated inline structures.

Avoid excessive type assertions.

If a type assertion is necessary, understand why TypeScript cannot infer
the type and document unusual cases.

------------------------------------------------------------------------

# 11. Runtime Validation

TypeScript types disappear at runtime.

Every external boundary MUST validate untrusted data.

Boundaries include:

-   API requests
-   API responses
-   form submissions
-   URL/search parameters
-   cookies
-   headers
-   environment variables
-   third-party webhooks
-   external service responses
-   persisted untrusted data

Use the project's approved validation library, such as Zod.

Never assume:

``` ts
const body = await request.json();
```

is trustworthy.

Validate first.

------------------------------------------------------------------------

# 12. Environment Variables

Environment variables MUST be centralized.

Do not scatter:

``` ts
process.env.SOMETHING
```

throughout the application.

Prefer:

``` text
lib/env/server.ts
lib/env/client.ts
```

with runtime validation.

Server-only environment variables MUST never be imported into client
code.

Environment validation SHOULD fail fast during startup/build when
required configuration is missing.

------------------------------------------------------------------------

# 13. Data Fetching Rules

Do not default to:

``` tsx
useEffect(() => {
  fetch(...)
}, [])
```

for application data.

Prefer server-side data fetching when appropriate.

Choose the data-fetching strategy based on:

-   rendering requirements
-   caching
-   authentication
-   freshness
-   interactivity
-   mutation requirements
-   performance

Do not introduce a client-side data-fetching library merely because it
is familiar.

Use the repository's established strategy consistently.

------------------------------------------------------------------------

# 14. API Client Rules

Do not scatter raw HTTP requests across UI components.

Bad:

``` tsx
await fetch("/api/orders");
```

inside multiple unrelated components.

Prefer centralized API/service modules.

The UI should depend on a clear application interface rather than HTTP
implementation details.

------------------------------------------------------------------------

# 15. Server Actions

Server Actions MUST be treated as public application boundaries.

They MUST:

-   validate input
-   authorize the caller
-   perform the required operation
-   return safe data
-   handle errors predictably

Never trust a Server Action merely because it can only be called from
the application's UI.

Authorization MUST happen server-side.

------------------------------------------------------------------------

# 16. Authentication vs Authorization

Authentication answers:

> Who is this user?

Authorization answers:

> Is this user allowed to perform this operation?

Never treat authentication as authorization.

Every protected mutation MUST enforce authorization.

Do not rely solely on:

``` text
hidden buttons
disabled buttons
client-side route guards
```

Security decisions MUST occur on the server.

------------------------------------------------------------------------

# 17. State Management

Use the smallest state scope possible.

### Local UI state

Use:

``` text
useState
useReducer
```

for local interaction.

### URL state

Use URL/search parameters for state that should be:

-   shareable
-   bookmarkable
-   navigation-aware
-   filter/sort/pagination related

### Server state

Prefer server-side data patterns or the application's approved
server-state library.

### Global client state

Use Zustand/Redux/etc. only when state genuinely needs application-wide
client ownership.

Do NOT put:

``` text
modal open state
input values
temporary UI state
hover state
```

into global stores.

------------------------------------------------------------------------

# 18. React Hook Rules

Hooks MUST:

-   be called only at the top level
-   never be conditionally called
-   never be called inside loops
-   never be called inside ordinary utility functions

Avoid unnecessary `useEffect`.

Before adding an effect, ask:

1.  Is this synchronizing with an external system?
2.  Can this be derived during render?
3.  Can this happen in an event handler?
4.  Can this happen on the server?

If the answer to 2--4 is yes, do not use `useEffect`.

------------------------------------------------------------------------

# 19. Component Design & Atomic Layering Rules

Components MUST have a clear responsibility and follow the Atomic Design hierarchy.

Before authoring any component, classify it into its exact atomic tier:

1. **Atoms (`components/atoms/`)**:
   - Indivisible, foundational visual primitives (e.g., `Button`, `Input`, `Badge`, `Card`, `Icon`).
   - Purely presentational and stateless (except basic focus/hover states).
   - Zero business logic, zero domain knowledge, zero network calls.
   - CANNOT import Molecules, Organisms, Templates, Features, or App Router files.

2. **Molecules (`components/molecules/`)**:
   - Simple, functional groupings of two or more Atoms (e.g., `Modal`, `EmptyState`, `FormField`, `SearchBar`).
   - Local and ephemeral UI state only (e.g., `isOpen`, expanded, active tab).
   - Purely presentational; no domain business rules, no API calls, no database access.
   - CANNOT import Organisms, Templates, Features, or App Router files.

3. **Organisms (`components/organisms/` & `features/**/components/`)**:
   - Distinct, complex UI sections composed of Molecules, Atoms, and other sub-organisms.
   - Global organisms (`Header`, `Footer`, `Sidebar`, `DataTable`) live in `components/organisms/` and MUST remain domain-agnostic.
   - Domain-specific organisms (`CreateOrderDialog`, `OrderList`, `LoginForm`) live in `features/<feature>/components/` and compose feature services/actions with shared presentation components.
   - Shared organisms CANNOT import Feature-internal logic, Templates, or Pages.

4. **Templates (`components/templates/`)**:
   - Page wireframes and slot orchestrators (`MarketingTemplate`, `DashboardTemplate`, `AuthTemplate`).
   - Define continuous layout rhythm, grid bounds, and spacing gutters using slots (`ReactNode`).
   - Completely decoupled from live backend data fetching and mutations.
   - CANNOT import Feature domain logic, server database clients, or App Router pages.

5. **Pages (`app/**/page.tsx`)**:
   - Route instances implemented as Server Components by default.
   - Fetch domain data, validate authentication/authorization, and pass real data and Server Actions into Templates and Organisms.

Avoid monolithic components that simultaneously contain:

-   API calls
-   business logic
-   validation
-   complex state machines
-   data transformation
-   rendering
-   analytics
-   authorization
-   multiple unrelated UI sections

Prefer composition:

``` tsx
<DashboardTemplate
  headerSlot={<DashboardHeader />}
  statsSlot={<OrderStats orders={orders} />}
  actionsSlot={<CreateOrderButton />}
  contentSlot={<OrderList orders={orders} />}
/>
```

over monolithic components.

------------------------------------------------------------------------

# 20. Component Size

Line count is not a perfect architectural metric, but unusually large
components require scrutiny.

As a guideline:

-   \~250 lines: review responsibility boundaries.
-   \~400 lines: refactoring should normally be considered.
-   \~600+ lines: architectural review is required.

Do not split components merely to satisfy a line count. Split them
around responsibilities and domain concepts.

------------------------------------------------------------------------

# 21. Props Rules

Props MUST be intentional.

Avoid:

``` ts
props: any
```

Avoid passing entire domain objects when only a few fields are required.

Prefer:

``` ts
type UserCardProps = {
  id: string;
  name: string;
  avatarUrl?: string;
};
```

Do not pass infrastructure objects into presentation components.

------------------------------------------------------------------------

# 22. Forms

All non-trivial forms MUST have:

-   schema validation
-   accessible labels
-   clear error states
-   loading/submission states
-   success handling
-   server-side validation
-   appropriate keyboard behavior

Never rely exclusively on client-side validation.

------------------------------------------------------------------------

# 23. Loading, Empty, Error, and Success States

Every asynchronous feature MUST deliberately handle:

``` text
Loading
Success
Empty
Error
Retry
```

Do not design only the happy path.

Where appropriate, use:

``` text
loading.tsx
error.tsx
not-found.tsx
```

and component-level states.

------------------------------------------------------------------------

# 24. Error Handling

Never expose:

-   stack traces
-   SQL errors
-   internal service details
-   secret values
-   infrastructure topology
-   sensitive identifiers

to users.

User-facing errors MUST be safe and understandable.

Server-side logs MUST contain enough context to diagnose the failure.

Never silently swallow errors.

Bad:

``` ts
try {
  ...
} catch {
  return null;
}
```

unless failure is explicitly expected and handled.

------------------------------------------------------------------------

# 25. Logging

Do not use:

``` ts
console.log()
```

as production application logging.

Use the application's centralized logger.

Logs SHOULD include useful structured context such as:

``` text
requestId
route
userId
tenantId
operation
duration
status
error
```

Never log:

-   passwords
-   tokens
-   session cookies
-   API secrets
-   payment credentials
-   sensitive personal data

------------------------------------------------------------------------

# 26. Request Correlation

Requests crossing service boundaries SHOULD preserve a
correlation/request ID.

Example:

``` text
Browser
  ↓ request-id
Next.js
  ↓ request-id
Backend API
  ↓ request-id
Database / worker
```

This makes production debugging and tracing significantly easier.

------------------------------------------------------------------------

# 27. Caching

Caching MUST be intentional.

Before adding a cache, define:

-   what is cached
-   cache key
-   TTL/revalidation strategy
-   invalidation strategy
-   stale-data tolerance
-   authorization implications

Never cache private data in a shared cache without proving isolation.

Do not add caching simply because "caching is faster."

Incorrect caching can create correctness and security bugs.

------------------------------------------------------------------------

# 28. Performance Rules

Every feature MUST consider:

-   server/client boundary
-   JavaScript shipped to the browser
-   image size
-   font loading
-   rendering strategy
-   caching
-   network requests
-   bundle size
-   layout stability

Avoid unnecessary client JavaScript.

Avoid importing large libraries when a small local implementation is
sufficient.

Do not import an entire library when only one small function is required
if tree-shaking cannot eliminate the rest.

------------------------------------------------------------------------

# 29. Images

Prefer Next.js image optimization mechanisms.

Every image MUST have an intentional sizing strategy.

Avoid:

-   huge original images
-   unnecessary image formats
-   layout shifts
-   unbounded user-uploaded image dimensions
-   decorative images without appropriate accessibility semantics

Use appropriate:

``` text
width
height
sizes
priority
loading
```

based on actual usage.

------------------------------------------------------------------------

# 30. Fonts

Use the application's approved font-loading strategy.

Prefer framework-native font optimization.

Do not introduce external font requests casually.

Avoid unnecessary font families and weights.

------------------------------------------------------------------------

# 31. Accessibility

Accessibility is mandatory.

UI MUST support:

-   keyboard navigation
-   visible focus
-   semantic HTML
-   accessible names
-   form labels
-   meaningful alt text
-   appropriate ARIA only when necessary
-   sufficient contrast
-   logical heading hierarchy

Do not use ARIA to compensate for poor HTML semantics.

Prefer:

``` html
<button>
```

over:

``` html
<div onClick="">
```

------------------------------------------------------------------------

# 32. Responsive Design

Every production UI MUST be tested across relevant viewport classes.

Do not rely on:

``` text
desktop only
```

unless the product explicitly requires it.

Avoid hardcoded dimensions that create:

-   horizontal scrolling
-   clipped content
-   inaccessible controls
-   broken layouts

------------------------------------------------------------------------

# 33. SEO

Every indexable public route MUST deliberately define:

-   title
-   description
-   canonical URL where appropriate
-   Open Graph metadata where appropriate
-   robots behavior
-   structured data where applicable

Do not allow duplicate or meaningless metadata.

Authenticated/private routes MUST NOT accidentally become indexable.

------------------------------------------------------------------------

# 34. Security

All code MUST follow secure-by-default principles.

Never:

-   hardcode secrets
-   commit credentials
-   expose private environment variables
-   trust client authorization
-   construct unsafe SQL
-   render unsanitized HTML
-   bypass validation
-   disable security middleware without justification

Security-sensitive changes require additional review.

------------------------------------------------------------------------

# 35. Dangerous HTML

Avoid raw HTML rendering.

Do not use:

``` tsx
dangerouslySetInnerHTML
```

unless the content is explicitly trusted or has passed an appropriate
sanitization process.

Every use MUST have a clear justification.

------------------------------------------------------------------------

# 36. Dependencies

Before adding a dependency, ask:

1.  Do we already have this capability?
2.  Can the requirement be solved with existing platform/framework APIs?
3.  Is the dependency actively maintained?
4.  Does it introduce significant bundle/runtime cost?
5.  Does it introduce security or licensing concerns?
6.  Does it duplicate an existing dependency?

Do not add dependencies for trivial functionality.

Dependency versions MUST be controlled by the lockfile and approved
package-manager version.

------------------------------------------------------------------------

# 37. Circular Dependencies

Circular dependencies are forbidden.

Example:

``` text
Feature A → Feature B → Feature A
```

or:

``` text
component → service → component
```

must not exist.

Use architectural tooling to detect cycles.

------------------------------------------------------------------------

# 38. Import Rules

Prefer explicit imports.

Avoid deep imports into another feature's internals.

Bad:

``` ts
import { x } from "@/features/orders/services/internal/order-secret";
```

Prefer a public boundary:

``` ts
import { x } from "@/features/orders";
```

where the feature exposes an intentional API.

Use path aliases consistently.

Avoid relative imports that climb through many directory levels.

------------------------------------------------------------------------

# 39. Naming

Names MUST describe intent.

Prefer:

``` text
calculateOrderTotal
validateCheckoutInput
getCustomerById
createInvoice
```

Avoid:

``` text
process
handle
doThing
helper
data
temp
misc
```

unless the surrounding context makes the meaning genuinely obvious.

Boolean names should read naturally:

``` text
isLoading
hasPermission
canEdit
shouldRetry
```

------------------------------------------------------------------------

# 40. Business Logic

Business rules MUST NOT live inside JSX.

Bad:

``` tsx
{user.role === "ADMIN" && order.total > 10000 && ...}
```

when the rule is important to the domain.

Prefer a domain-level decision:

``` ts
canApproveHighValueOrder(user, order)
```

The UI renders the result.

This makes business rules:

-   testable
-   reusable
-   reviewable
-   independent of presentation

------------------------------------------------------------------------

# 41. Magic Values

Avoid unexplained constants:

``` ts
if (amount > 10000)
```

Prefer named domain constants:

``` ts
const HIGH_VALUE_ORDER_THRESHOLD = 10_000;
```

Do not scatter configuration values across components.

------------------------------------------------------------------------

# 42. Date and Time

Do not manually manipulate dates using ad-hoc string logic.

Standardize timezone handling.

Every date/time requirement MUST answer:

-   Which timezone?
-   Is the value an instant or calendar date?
-   Is it stored in UTC?
-   How is it displayed?

Avoid browser-local assumptions for business-critical timestamps.

------------------------------------------------------------------------

# 43. API Error Contracts

API errors MUST follow a consistent structure.

Do not return arbitrary error shapes from different endpoints.

A consistent error contract makes frontend handling predictable.

Do not expose internal exception messages directly.

------------------------------------------------------------------------

# 44. Testing Requirements

Every meaningful behavior change MUST include tests.

### Unit tests

Use for:

-   pure functions
-   business rules
-   validators
-   transformations
-   complex utilities

### Integration tests

Use for:

-   services
-   server actions
-   route handlers
-   database behavior
-   authentication/authorization flows

### E2E tests

Use for critical user journeys.

Critical workflows SHOULD include:

``` text
authentication
checkout
payments
core CRUD
critical admin operations
permissions
```

Do not replace all lower-level tests with E2E tests.

------------------------------------------------------------------------

# 45. Coverage

Minimum project benchmark:

``` text
Overall coverage: ≥ 80%
```

Recommended minimums:

``` text
Statements: ≥ 80%
Branches:   ≥ 75–80%
Functions:  ≥ 80%
Lines:      ≥ 80%
```

Coverage MUST NOT be used as the sole quality metric.

A PR that reduces coverage meaningfully SHOULD be rejected even if the
absolute number remains above 80%.

Do not write meaningless tests purely to increase coverage.

------------------------------------------------------------------------

# 46. E2E Smoke Testing

A small, stable smoke suite SHOULD run against the production
build/container.

At minimum, validate critical routes and workflows before production
deployment.

E2E tests MUST NOT depend on fragile implementation details.

Prefer user-visible behavior over DOM implementation details.

------------------------------------------------------------------------

# 47. Visual Regression

Critical UI surfaces SHOULD have visual regression coverage.

Examples:

``` text
authentication
dashboard
checkout
product page
major forms
critical tables
```

Do not approve intentional visual changes without reviewing the
resulting screenshots.

------------------------------------------------------------------------

# 48. Build Requirements

A production build MUST pass:

``` text
TypeScript
ESLint
tests
coverage
Next.js build
```

Never consider:

``` text
npm run dev
```

proof that the production application works.

Development mode and production builds have different behavior.

------------------------------------------------------------------------

# 49. Docker Requirements

Production applications MUST use reproducible Docker builds.

Never use:

``` dockerfile
FROM node:latest
```

Use an explicitly controlled Node.js runtime.

The project MUST pin:

-   Node.js version
-   package-manager version
-   dependency lockfile
-   relevant base image version

------------------------------------------------------------------------

# 50. Docker Multi-Stage Builds

Production images SHOULD use multi-stage builds:

``` text
dependencies
     ↓
builder
     ↓
runner
```

The final runtime image MUST NOT contain unnecessary:

-   source tooling
-   package-manager caches
-   development dependencies
-   test artifacts
-   credentials

Run the application as a non-root user where practical.

------------------------------------------------------------------------

# 51. Docker Build Reproducibility

CI MUST build the same Docker image that will be deployed.

Preferred flow:

``` text
Git commit
    ↓
Docker build
    ↓
Tests/security checks
    ↓
Image tagged with commit SHA
    ↓
Registry
    ↓
Deploy exact image
```

Do not rely on mutable `latest` tags for production deployment.

------------------------------------------------------------------------

# 52. Docker Compose

Development Compose files MUST be clearly separated from production
deployment configuration.

Do not accidentally expose:

-   databases
-   Redis
-   internal services
-   admin panels

to public interfaces.

Use environment-specific configuration.

------------------------------------------------------------------------

# 53. Health Checks

Production deployments SHOULD expose a lightweight health endpoint.

Distinguish:

``` text
liveness
readiness
```

A health endpoint MUST NOT expose secrets or sensitive infrastructure
details.

------------------------------------------------------------------------

# 54. CI Pipeline

Every pull request SHOULD pass:

``` text
install
↓
typecheck
↓
lint
↓
architecture checks
↓
unit tests
↓
integration tests
↓
coverage
↓
build
↓
E2E
↓
accessibility
↓
security scans
↓
Docker build
↓
container scan
```

Expensive checks may run in CI rather than Git hooks.

------------------------------------------------------------------------

# 55. Git Hooks

Husky SHOULD remain fast.

### Pre-commit

Run:

-   formatting
-   lint-staged
-   fast checks

### Commit-msg

Validate Conventional Commits.

### Pre-push

Run reasonable local checks such as:

-   typecheck
-   lint
-   unit tests

Do NOT make developers wait through the complete CI pipeline for every
commit.

------------------------------------------------------------------------

# 56. Commit Convention

Use Conventional Commits.

Examples:

``` text
feat(auth): add password reset
fix(cart): prevent duplicate products
refactor(order): extract pricing service
test(order): add checkout coverage
perf(images): optimize product gallery
docs(api): update integration guide
chore(deps): update dependencies
ci(docker): improve production image
```

Breaking changes MUST be explicitly marked.

------------------------------------------------------------------------

# 57. Pull Request Rules

A PR MUST:

-   have a meaningful title
-   describe the problem
-   describe the solution
-   include relevant tests
-   identify breaking changes
-   identify migration requirements
-   pass all mandatory CI checks

Do not merge with failing mandatory checks.

Do not bypass branch protection.

------------------------------------------------------------------------

# 58. Code Review Rules

Reviewers MUST evaluate:

### Correctness

Does the feature work?

### Architecture

Does it belong in this layer?

### Security

Can a malicious client bypass the intended behavior?

### Performance

Does it introduce unnecessary client JS, requests, or expensive
rendering?

### Accessibility

Can keyboard and assistive-technology users operate it?

### Maintainability

Will another developer understand this six months later?

### Testing

Are important behaviors actually covered?

------------------------------------------------------------------------

# 59. AI Agent Rules

AI agents MUST NOT:

-   invent architecture
-   introduce arbitrary libraries
-   rewrite large sections unnecessarily
-   bypass existing abstractions
-   disable ESLint rules
-   suppress TypeScript errors
-   weaken tests
-   reduce coverage thresholds
-   remove security controls
-   expose secrets
-   change Docker security settings casually
-   change authentication/authorization behavior without explicit intent

Before modifying code, AI agents SHOULD inspect related implementations
and follow existing patterns.

AI-generated code MUST pass the same checks as human-written code.

------------------------------------------------------------------------

# 60. Minimal-Change Rule

When fixing a bug:

1.  Understand the existing behavior.
2.  Identify the root cause.
3.  Make the smallest correct architectural change.
4.  Add a regression test.
5.  Run the relevant checks.

Do not rewrite an entire feature merely because another implementation
looks cleaner.

Refactoring and bug fixing should be separate when practical.

------------------------------------------------------------------------

# 61. No Silent Architecture Changes

The following require explicit review:

-   changing state-management strategy
-   changing authentication
-   changing authorization
-   changing data-fetching architecture
-   introducing a new database/client
-   introducing a new HTTP client
-   introducing a new UI framework
-   changing Docker runtime strategy
-   changing caching semantics
-   changing build/deployment behavior
-   changing security headers
-   changing public API contracts

------------------------------------------------------------------------

# 62. Observability

Production features SHOULD provide:

-   structured logs
-   meaningful error reporting
-   request correlation
-   performance measurements for critical operations

Errors SHOULD be captured by the approved monitoring platform.

Do not add sensitive data to monitoring payloads.

------------------------------------------------------------------------

# 63. Performance Budgets

The project SHOULD establish explicit budgets for:

``` text
LCP
INP
CLS
initial JavaScript
route JavaScript
image payloads
```

Recommended Core Web Vitals targets:

``` text
LCP ≤ 2.5s
INP ≤ 200ms
CLS ≤ 0.1
```

Performance regressions SHOULD block important production changes.

------------------------------------------------------------------------

# 64. Accessibility Budget

Accessibility regressions SHOULD be treated as CI failures for critical
pages.

Automated checks are necessary but not sufficient.

Critical workflows SHOULD also receive manual keyboard testing.

------------------------------------------------------------------------

# 65. Database Access

Database access MUST be server-only.

Never:

``` text
Client Component → database
Browser → database directly
```

Database credentials MUST never be shipped to the browser.

Database access SHOULD live behind repositories/services where the
application architecture requires that abstraction.

------------------------------------------------------------------------

# 66. Third-Party Services

Third-party integrations MUST be isolated.

Prefer:

``` text
features/
    ↓
service
    ↓
integration adapter
    ↓
third-party SDK
```

Do not scatter SDK-specific code throughout components.

This makes provider replacement and testing easier.

------------------------------------------------------------------------

# 67. Webhooks

Webhook endpoints MUST:

1.  Verify authenticity/signature.
2.  Validate payload.
3.  Be idempotent where required.
4.  Handle retries safely.
5.  Avoid trusting client-provided identity.
6.  Log a correlation ID.
7.  Return appropriate status codes.

Never process an unverified webhook as trusted input.

------------------------------------------------------------------------

# 68. Rate Limiting

Public or abuse-prone endpoints SHOULD have appropriate rate limiting.

Examples:

-   authentication
-   password reset
-   OTP
-   search
-   file uploads
-   public APIs
-   expensive operations

Rate limits must not be treated as the only security control.

------------------------------------------------------------------------

# 69. File Uploads

Uploads MUST validate:

-   file size
-   file type
-   content type
-   extension where appropriate
-   authorization
-   storage destination

Never trust the browser-provided MIME type alone.

Avoid storing arbitrary executable content in publicly executable
locations.

------------------------------------------------------------------------

# 70. Accessibility and Keyboard Safety

Interactive elements MUST remain usable when the browser keyboard or
virtual keyboard changes viewport dimensions.

Do not rely exclusively on fixed viewport heights.

Forms and bottom actions MUST remain reachable.

------------------------------------------------------------------------

# 71. Atomic Design System & Continuous UI Architecture

Complex applications suffer from visual fragmentation, inconsistent UX, and high maintenance costs when developers write ad-hoc styles or assemble screens without a unified structural rhythm.

This codebase strictly mandates the **Atomic Design System** and **Continuous UI Architecture** from the root level. Every visual element MUST belong to a distinct atomic tier and follow strict one-way downward composition:

``` text
Design Tokens (tokens.css)
        ↓
    Atoms (components/atoms)
        ↓
  Molecules (components/molecules)
        ↓
  Organisms (components/organisms & features/**/components)
        ↓
  Templates (components/templates)
        ↓
    Pages (app/**/page.tsx)
```

### The Continuous UI Mandate

1.  **Visual Continuity**: Every screen must share the identical visual rhythm. Section padding (`--space-16` / `--space-12`), content container bounds (`.container`), card padding (`--space-6`), and button sizes MUST be uniform across all routes.
2.  **Harmonious Hierarchy**: Layouts must not jump between differing typographic scales or unaligned spacing gutters.
3.  **Responsive Continuity**: All viewports must resize predictably using token-driven flex and grid layouts. Hardcoded pixel dimensions that break continuity across viewports are forbidden.
4.  **No Ad-Hoc Components**: Never invent private, one-off UI primitives when the design system provides an approved component (`Button`, `Input`, `Badge`, `Card`, `Modal`, `EmptyState`, etc.).
5.  **Component Promotion**: If a genuinely new primitive is needed, add it to `components/atoms/` or `components/molecules/` as a reusable, token-driven component with unit tests.

### Atomic Tier Specifications

-   **Atoms (`src/components/atoms/`)**:
    The foundational building blocks that cannot be broken down further. Stateless, purely presentational, zero business logic.
    *Rules:* CANNOT import Molecules, Organisms, Templates, Features, or App Router code.
-   **Molecules (`src/components/molecules/`)**:
    Simple combinations of two or more Atoms acting as a unit (e.g., `FormField`, `Modal`, `EmptyState`). Local UI state only.
    *Rules:* CANNOT import Organisms, Templates, Features, or App Router code.
-   **Organisms (`src/components/organisms/` & `src/features/**/components/`)**:
    Distinct, complex UI blocks. Shared organisms (`Header`, `Footer`, `DataTable`) are domain-agnostic. Domain organisms (`OrderList`, `CreateOrderDialog`) live within their respective feature folder.
    *Rules:* Shared organisms CANNOT import Feature domain logic or Templates.
-   **Templates (`src/components/templates/`)**:
    Slot-based wireframe page structures (`MarketingTemplate`, `DashboardTemplate`, `AuthTemplate`). Orchestrate layout containers and responsive grids using slots (`ReactNode`). Decoupled from live backend data fetching.
    *Rules:* CANNOT import Feature domain logic or server database modules.
-   **Pages (`src/app/**/page.tsx`)**:
    Server Component route handlers that authenticate, fetch server data, and inject domain data into Templates and Organisms.

### Strict Boundary Enforcement (ESLint)

Atomic boundaries are strictly enforced at build-time using `eslint-plugin-boundaries`. Inverting the hierarchy (e.g. an Atom importing a Molecule, or a Molecule importing an Organism) causes an immediate CI/lint build failure.

------------------------------------------------------------------------

# 72. Design Token Invariance & Zero-Magic-Styles Mandate

All visual styling MUST strictly resolve to centralized design tokens defined in `src/styles/tokens.css`.

Arbitrary, hardcoded style values ("magic numbers") fragment visual continuity and are prohibited:

1.  **Colors**:
    -   Use `hsl(var(--color-*))`, `hsl(var(--bg-*))`, and `hsl(var(--text-*))`.
    -   Raw hex literals (`#ffffff`, `#1e293b`, `#3b82f6`) are strictly forbidden in UI components and are enforced via ESLint.
2.  **Spacing Scale**:
    -   Use the standardized token scale:
        ``` text
        --space-1:  0.25rem (4px)
        --space-2:  0.5rem  (8px)
        --space-3:  0.75rem (12px)
        --space-4:  1rem    (16px)
        --space-5:  1.25rem (20px)
        --space-6:  1.5rem  (24px)
        --space-8:  2rem    (32px)
        --space-10: 2.5rem  (40px)
        --space-12: 3rem    (48px)
        --space-16: 4rem    (64px)
        ```
    -   Arbitrary margins or paddings (e.g., `margin: '13px'`, `padding: '18px 27px'`) are strictly forbidden.
3.  **Border Radii**:
    -   Use `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, or `--radius-full`.
4.  **Shadows**:
    -   Use `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, or `--shadow-glow`.
5.  **Motion**:
    -   Use `--transition-fast`, `--transition-base`, or `--transition-smooth`.

------------------------------------------------------------------------

# 73. Animation

Animations MUST serve a purpose.

Avoid:

-   excessive motion
-   animation on every element
-   blocking transitions
-   long-duration UI animations
-   animations that hurt accessibility

Respect reduced-motion preferences.

Prefer transform/opacity-based animation for performant transitions.

------------------------------------------------------------------------

# 74. Accessibility of Motion

Motion MUST NOT prevent users from understanding or operating the
application.

Respect:

``` css
prefers-reduced-motion
```

where applicable.

------------------------------------------------------------------------

# 75. Internationalization and Formatting

If the application supports multiple locales:

-   do not hardcode user-facing date formats
-   do not hardcode currency formats
-   do not concatenate translated sentences incorrectly
-   centralize locale handling

User-facing strings SHOULD be kept separate from business logic where
the project uses localization.

------------------------------------------------------------------------

# 76. Documentation

Architecturally significant decisions SHOULD be documented.

Use ADRs for decisions such as:

``` text
authentication architecture
state management
caching strategy
database access
deployment architecture
major dependency selection
```

Keep `README.md` focused on onboarding and local development.

Keep `ARCHITECTURE.md` focused on system structure.

Keep this `AGENTS.md` focused on engineering rules.

------------------------------------------------------------------------

# 77. Forbidden Patterns Summary

The following patterns are prohibited unless explicitly justified:

``` text
❌ any
❌ @ts-ignore
❌ @ts-nocheck
❌ unnecessary "use client"
❌ database access from client
❌ secrets in client code
❌ direct process.env access throughout code
❌ console.log in production code
❌ arbitrary dangerouslySetInnerHTML
❌ business logic inside JSX
❌ giant components
❌ global state for local UI state
❌ unnecessary useEffect
❌ raw fetch calls scattered across UI
❌ duplicate API clients
❌ duplicate design-system components
❌ Atom importing Molecule, Organism, Template, or Feature
❌ Molecule importing Organism, Template, or Feature
❌ Organism importing Template or Feature domain logic
❌ Template importing Feature domain logic
❌ hardcoded colors or arbitrary magic-pixel spacing bypassing Design Tokens
❌ business logic or API calls inside Atoms or Molecules
❌ ad-hoc, fragmented UI components built outside the atomic hierarchy
❌ circular dependencies
❌ feature-internal imports across boundaries
❌ unvalidated external data
❌ client-only authorization
❌ unverified webhooks
❌ hardcoded secrets
❌ mutable production Docker tags
❌ node:latest
❌ bypassing CI
❌ disabling lint rules to make CI pass
❌ lowering test coverage to make CI pass
❌ tests that only exist to inflate coverage
```

------------------------------------------------------------------------

# 78. Required Development Workflow

Every meaningful change MUST follow:

``` text
1. Understand
      ↓
2. Identify architectural boundary
      ↓
3. Implement
      ↓
4. Format
      ↓
5. Typecheck
      ↓
6. ESLint
      ↓
7. Architecture checks
      ↓
8. Unit tests
      ↓
9. Integration tests
      ↓
10. Coverage
      ↓
11. Build
      ↓
12. E2E
      ↓
13. Accessibility
      ↓
14. Security checks
      ↓
15. Docker build
      ↓
16. Container scan
      ↓
17. Performance validation
      ↓
18. Review
      ↓
19. Conventional Commit
```

Not every check needs to run locally before every change; CI is the
final enforcement layer.

------------------------------------------------------------------------

# 79. Pre-Merge Definition of Done

A change is NOT complete until:

-   [ ] TypeScript passes.
-   [ ] ESLint passes.
-   [ ] Architecture/dependency checks pass.
-   [ ] Atomic design boundaries (Tokens → Atoms → Molecules → Organisms → Templates → Pages) are preserved.
-   [ ] Design tokens are strictly consumed without raw hex colors or arbitrary magic-pixel spacing.
-   [ ] Tests pass.
-   [ ] Coverage meets the project threshold.
-   [ ] No meaningful coverage regression exists.
-   [ ] Production build succeeds.
-   [ ] Critical E2E workflows pass.
-   [ ] Accessibility checks pass.
-   [ ] Security scans pass.
-   [ ] Docker production image builds.
-   [ ] Container scan passes.
-   [ ] Relevant performance checks pass.
-   [ ] Error/loading/empty states are handled.
-   [ ] Authentication/authorization is enforced server-side.
-   [ ] No secrets are exposed.
-   [ ] Documentation is updated when architecture changed.
-   [ ] PR review is complete.
-   [ ] Commit follows project convention.

------------------------------------------------------------------------

# 80. Final Rule

When adding or changing code, always ask:

> **"Does this make the architecture easier or harder to understand six
> months from now?"**

If the answer is "harder", redesign it before merging.

The goal of this repository is not merely to make the application work.

The goal is to make it:

``` text
Correct
Secure
Testable
Observable
Performant
Accessible
Scalable
Maintainable
Reproducible
```

while making architectural violations difficult to introduce
accidentally.

**The compiler, linter, tests, CI pipeline, Docker build, and code
review are all part of the architecture.**
