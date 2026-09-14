# Implementation Plan: Jira/Confluence Automation

Based on the updated specification ([`specification.md`](./specification.md))
and its clarifications ([`clarify.md`](./clarify.md)), consistent with the
fixed stack and principles in [`constitution.md`](./constitution.md).

## Phase 1: Backend Setup (Database, API Skeleton)

**Goal:** A running Express API backed by PostgreSQL, with auth, health
check, and empty route handlers wired up — no business logic yet.

- Initialize `backend/` with Node.js 22.x + Express 4.19.x.
- Stand up PostgreSQL 15 via Docker Compose; run migrations including
  `CREATE EXTENSION IF NOT EXISTS pgcrypto;` and all tables from the data
  model (`users`, `notes`, `action_items`, `jira_tickets`,
  `confluence_pages`).
- Implement session-based login (`/api/v1/auth/login`) with `bcrypt`.
- Implement `/api/v1/health`.
- Wire up CORS restricted to `FRONTEND_ORIGIN`.
- Stub remaining `/api/v1/*` routes (return `501 Not Implemented`).

**Milestone:** `docker compose up` starts backend + database; `GET
/api/v1/health` returns `200`; login endpoint authenticates a seeded user.

## Phase 2: Frontend Setup (UI Skeleton, Routing)

**Goal:** A running React + Vite app with routing between the four screens
and a working login flow against the real backend — no real data yet
(mocked/empty states).

- Initialize `frontend/` with Vite + React 18.3.x.
- Set up client-side routing: Login, Notes Input, Review, Confluence Draft,
  Results screens.
- Implement the `api/client.js` wrapper (fetch + session cookie handling).
- Wire login screen to `/api/v1/auth/login`; redirect to Notes Input on
  success.

**Milestone:** `npm run dev` serves the app on port 5173; a user can log in
and navigate between all screen placeholders.

## Phase 3: Feature Implementation (One Feature at a Time)

**Goal:** Each user story from the specification implemented end-to-end
(UI → API → DB → external service), one at a time, in this order:

1. **Notes extraction** — `POST /api/v1/notes/extract` (pattern matcher +
   `llmExtractor` fallback) wired to the Notes Input screen.
2. **Candidate review** — `GET /api/v1/notes/:noteId/candidates` and
   `PATCH /api/v1/candidates/:id` wired to the Review screen.
3. **Jira ticket creation** — `jiraClient` service + `POST /api/v1/tickets`
   wired to the Review screen's submit action and the Results screen.
4. **Confluence publishing** — `confluenceClient` service +
   `POST /api/v1/confluence/pages` wired to the Confluence Draft screen and
   Results screen.

**Milestone:** A user can paste notes, review/edit/approve candidates, create
Jira tickets, and publish a Confluence page, with results visible in the UI.

## Phase 4: Integration and Testing

**Goal:** Verify the full flow works together, harden error handling, and
confirm compliance with the constitution's quality/security principles.

- End-to-end test: notes → extraction → review → ticket creation →
  Confluence publish, using mocked Jira/Confluence API clients (per
  constitution's testability principle).
- Verify per-item failure handling (`207 Multi-Status` batch behavior).
- Verify auth gate rejects unauthenticated requests to all protected routes.
- Verify `.env`-only secret handling — no PAT/API key ever logged or
  persisted to Postgres.
- Docker Compose smoke test: fresh `docker compose up` brings up frontend,
  backend, and database together with no manual steps.

**Milestone:** All acceptance criteria in [`tasks.md`](./tasks.md) pass;
prototype is demo-ready.
