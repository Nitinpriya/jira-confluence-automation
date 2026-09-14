# Project Constitution: Jira/Confluence Automation

## 1. Project Identity

- **Name:** Jira/Confluence Automation
- **Purpose:** Automate the flow of information between team processes (e.g.
  meeting notes, review workflows) and Jira/Confluence — extracting actionable
  items, presenting them for human review, and creating/updating Jira tickets
  and Confluence content on confirmation.
- **Target user:** Scrum Masters / team leads who currently re-enter
  action items and documentation into Jira/Confluence by hand and want a
  reviewed, semi-automated alternative.

## 2. Purpose of This Document

This constitution defines the non-negotiable principles, constraints, and conventions
that govern all specifications, plans, tasks, and implementation work for the
Jira/Confluence automation project. Every later Spec-Driven Development phase
(`/specify`, `/clarify`, `/plan`, `/tasks`, `/analyze`, `/implement`) must comply
with this document. Where a conflict arises, this constitution takes precedence.

## 3. Tech Stack (Fixed, with Versions)

- **Frontend:** React 18.3.x + Vite 5.x
- **Backend:** Node.js 22.x (LTS) + Express 4.19.x
- **Database:** PostgreSQL 15.x, run via Docker (official `postgres:15` image)
- **Container orchestration:** Docker Compose (Compose spec v2)

No alternative frameworks, languages, or databases may be substituted without an
explicit amendment to this constitution.

## 4. Architecture Principles

- **Separation of concerns:** Frontend (`frontend/`) and backend (`backend/`) are
  independently deployable; the frontend communicates with the backend exclusively
  through a versioned REST API — no direct database access from the frontend.
- **Statelessness:** Backend API processes must be stateless; all persistent state
  lives in PostgreSQL.
- **Single source of truth:** PostgreSQL is the system of record for all data
  synced from or queued to Jira/Confluence. External API calls must not be treated
  as a substitute for local persistence.
- **Containerization:** Every service (frontend, backend, database) must run in
  Docker and be defined in `docker-compose.yml`; local setup must not require
  manually installed system-level dependencies beyond Docker.

## 5. Security Principles

- **Credentials:** Jira/Confluence Personal Access Tokens (PATs) and any secrets
  must be supplied via environment variables (`.env`, excluded from version
  control) and never hard-coded, logged, or printed.
- **Least privilege:** API tokens must request only the scopes required for the
  automation's specific operations.
- **Input validation:** All backend endpoints must validate and sanitize input at
  the API boundary before use in database queries or outbound Jira/Confluence
  calls; use parameterized queries exclusively (no raw string-concatenated SQL).
- **Transport security:** All calls to Jira/Confluence APIs must use HTTPS; no
  plaintext credential transmission.

## 6. Quality Principles

- **Human-in-the-loop:** Any action that creates, modifies, or deletes data in
  Jira or Confluence must have an explicit confirmation step before execution —
  no silent automatic writes to external systems.
- **Error handling:** Failures calling external APIs must be reported per-item
  (not fail-fast for a whole batch) and summarized to the user; errors must never
  be swallowed silently.
- **Testability:** Backend services must be structured so that Jira/Confluence
  API clients can be mocked in tests; business logic must not be tightly coupled
  to live network calls.

## 7. Collaboration Conventions

- Specifications (`spec/`) describe *what* and *why* in user/business terms and
  must not prescribe implementation details beyond what's fixed in this
  constitution.
- Plans (`plan/` or equivalent) translate specifications into concrete technical
  designs consistent with Section 2's fixed stack.
- Tasks must be small, ordered, and independently verifiable.

## 8. Folder Structure Conventions

```
frontend/                  # React + Vite app
  src/
    components/            # one component per file, PascalCase filenames
    api/                    # backend API client wrappers
    pages/                  # route-level views
backend/                   # Node.js + Express app
  src/
    routes/                 # Express routers, one resource per file
    services/               # business logic, external API clients (Jira/Confluence)
    models/                 # PostgreSQL data-access/query modules
    config/                 # env loading, app configuration
  tests/
docker-compose.yml          # frontend + backend + postgres services
spec/                       # constitution.md, specification.md, plans, tasks
```

## 9. Coding Standards

- **Naming:** camelCase for variables/functions, PascalCase for React components
  and classes, UPPER_SNAKE_CASE for constants/env var names, kebab-case for
  non-component file/directory names.
- **File organization:** one exported component/class/route per file; file name
  matches the primary export name.
- **JavaScript/JSX:** ES modules (`import`/`export`) throughout, both frontend
  and backend; no mixing with CommonJS `require`.
- **SQL:** parameterized queries only (see Section 4); table names snake_case,
  plural (e.g. `action_items`).

## 10. Amendment Process

Changes to this constitution (e.g., tech stack changes, new security
requirements) must be made explicitly to this file and called out in the commit
message; specifications or plans may not silently override it.
