# Helpdesk Ticketing System — Backend API

A production-style REST API for an enterprise IT support ticketing platform, built with
Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Architecture

The codebase follows a **modular controller/service/route** pattern rather than a flat
MVC structure, so each domain (`auth`, `tickets`, `comments`, `categories`, `users`) is
self-contained:

```
src/
├── app.ts                 # Express app assembly (middleware + route mounting)
├── server.ts               # Entry point: DB connection, listen, graceful shutdown
├── config/
│   ├── prisma.ts            # Singleton PrismaClient
│   └── swagger.ts           # OpenAPI spec generation from JSDoc route comments
├── middleware/
│   ├── auth.middleware.ts       # JWT verification
│   ├── authorize.middleware.ts  # Role-based access control
│   ├── validate.middleware.ts   # Zod schema validation
│   └── error.middleware.ts      # Central error handler (last middleware in the chain)
├── modules/
│   ├── auth/         # register, login, refresh, /me
│   ├── users/         # admin-only user management (create agents/admins, deactivate)
│   ├── tickets/       # ticket CRUD, assignment, status workflow, dashboard stats
│   ├── comments/      # nested under /tickets/:ticketId/comments
│   └── categories/    # admin-managed ticket categories
├── types/            # Express Request augmentation for req.user
└── utils/            # logger (winston), JWT helpers, ApiResponse/AppError
```

**Why this shape:** each module owns its validation schema, service (business logic),
controller (thin HTTP layer), and routes. Business logic never lives in controllers,
which keeps the HTTP layer swappable and the logic unit-testable in isolation.

### Key design decisions

- **Central AppError class** — every thrown error carries a status code and flows to
  one error-handling middleware, so response shape is consistent everywhere.
- **Ticket status is a state machine** — `ALLOWED_TRANSITIONS` in `ticket.service.ts`
  prevents illegal jumps (e.g. `OPEN → CLOSED` directly). Every status change and
  reassignment is written to `TicketHistory` inside the same DB transaction as the
  update, so history can never drift from the ticket's real state.
- **Role-based data scoping happens in the service layer, not just route guards** —
  an employee's `GET /tickets` query is silently scoped to their own tickets, an
  agent's to their assigned tickets; only admins see everything. This mirrors how
  real multi-tenant/RBAC systems enforce visibility (belt-and-braces beyond middleware).
- **Internal comments** — agents/admins can leave notes employees never see
  (`isInternal` flag), a common real-world helpdesk requirement.
- **Self-registration is always EMPLOYEE** — agents and admins are provisioned only
  by an existing admin via `/users`, never self-assigned, to prevent privilege escalation.

## Getting started

### Option A — Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres + the API, runs migrations automatically, and the API is
available at `http://localhost:4000`.

### Option B — Local

```bash
cp .env.example .env      # point DATABASE_URL at your local Postgres
npm install
npm run prisma:migrate
npm run prisma:seed        # optional demo data (see below)
npm run dev
```

### Seed accounts

Running `npm run prisma:seed` creates three accounts (all password `Password123`):

| Role          | Email                    |
|---------------|--------------------------|
| ADMIN         | admin@helpdesk.local     |
| SUPPORT_AGENT | agent@helpdesk.local     |
| EMPLOYEE      | employee@helpdesk.local  |

## API documentation

Interactive Swagger UI: `http://localhost:4000/api-docs`

## Ticket workflow

```
OPEN → ASSIGNED → IN_PROGRESS → WAITING_FOR_USER → RESOLVED → CLOSED
                        ↑______________↓                ↓
                                              (dispute) → IN_PROGRESS
```

Employees cannot change status directly — only support agents (on tickets assigned
to them) and admins can, and only along legal transitions.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build |
| `npm run prisma:migrate` | Run Prisma migrations (dev) |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm test` | Run Jest test suite |

## Roadmap (see project plan)

- **Phase 2:** Next.js frontend with role-specific dashboards (shadcn/ui, TanStack Query)
- **Phase 3:** File attachments (S3-compatible storage), automated tests, CI, seed/demo data expansion, deployment config
