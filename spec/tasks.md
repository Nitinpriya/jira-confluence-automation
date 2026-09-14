# Task Breakdown: Jira/Confluence Automation

Derived from [`plan.md`](./plan.md). Each task has a title, description,
acceptance criteria, and dependencies.

---

## Phase 0: Project Scaffold

### TASK-01: Initialize frontend with Vite + React 18

**Description:**
Create the `frontend/` directory and initialize a new Vite project using the
React template. Install base dependencies.

**Acceptance Criteria:**
- [ ] `frontend/` directory exists with `package.json`, `vite.config.js`,
      `index.html`, and `src/` folder.
- [ ] `npm run dev` started from `frontend/` launches a dev server on port
      5173.
- [ ] Browser shows the default Vite + React starter page at
      `http://localhost:5173`.
- [ ] React version in `package.json` is `^18.x`.

**Dependencies:** None.

### TASK-02: Initialize backend with Express

**Description:**
Create the `backend/` directory, initialize npm, and install Express. Create
a minimal `index.js` that starts a server and responds to `GET /api/v1/health`.

**Acceptance Criteria:**
- [ ] `backend/` directory exists with `package.json` and `index.js`.
- [ ] `node index.js` started from `backend/` starts the server on port 3001
      (read from `PORT` env variable, default 3001).
- [ ] `GET http://localhost:3001/api/v1/health` returns
      `{ "status": "ok" }` with HTTP 200.
- [ ] All installed packages meet the Node.js 22.x LTS compatibility
      requirement.

**Dependencies:** None.

### TASK-03: Stand up PostgreSQL via Docker Compose

**Description:**
Add a `postgres:15` service to `docker-compose.yml` alongside placeholders
for `frontend` and `backend`. Add an initial migration script that runs
`CREATE EXTENSION IF NOT EXISTS pgcrypto;` and creates the `users`, `notes`,
`action_items`, `jira_tickets`, and `confluence_pages` tables from the
specification's data model.

**Acceptance Criteria:**
- [ ] `docker compose up` starts a `postgres:15` container with a named
      volume for data persistence.
- [ ] On first startup, the migration creates the `pgcrypto` extension and
      all five tables with the exact columns/constraints in
      `specification.md` Section 6.
- [ ] Connecting via `psql` and running `\dt` lists all five tables.

**Dependencies:** None.

---

## Phase 1: Backend Setup (Database, API Skeleton)

### TASK-04: Implement session-based login

**Description:**
Add `bcrypt`-based password hashing and session/cookie auth. Implement
`POST /api/v1/auth/login`. Seed one user via a migration/seed script for
local development.

**Acceptance Criteria:**
- [ ] `POST /api/v1/auth/login` with correct seeded credentials returns
      `{ ok: true }` and sets a session cookie.
- [ ] Incorrect credentials return HTTP 401 with no session cookie set.
- [ ] Password is never stored or logged in plaintext.

**Dependencies:** TASK-02, TASK-03.

### TASK-05: Add auth middleware and CORS

**Description:**
Add Express middleware that rejects unauthenticated requests to all
`/api/v1/*` routes except `/api/v1/health` and `/api/v1/auth/login`. Add CORS
configuration restricted to the `FRONTEND_ORIGIN` env var.

**Acceptance Criteria:**
- [ ] Requesting any protected route without a valid session returns HTTP
      401.
- [ ] Requests from an origin other than `FRONTEND_ORIGIN` are rejected by
      CORS.
- [ ] `/api/v1/health` remains accessible without authentication.

**Dependencies:** TASK-04.

### TASK-06: Stub remaining API routes

**Description:**
Add route files for `notes`, `candidates`, `tickets`, and `confluence` under
`backend/src/routes/`, each returning HTTP 501 with a JSON body describing
the route as not yet implemented.

**Acceptance Criteria:**
- [ ] All six endpoints from `specification.md` Section 5 exist and return
      501 (except `/health` and `/auth/login`, which are fully implemented).
- [ ] Route files follow the naming/organization conventions in
      `constitution.md` Section 8.

**Dependencies:** TASK-05.

---

## Phase 2: Frontend Setup (UI Skeleton, Routing)

### TASK-07: Set up client-side routing and screens

**Description:**
Add a router with placeholder pages for Login, Notes Input, Review,
Confluence Draft, and Results screens (per `specification.md` Section 4).

**Acceptance Criteria:**
- [ ] Navigating to each of the 5 routes renders the corresponding
      placeholder screen without errors.
- [ ] Unauthenticated users are redirected to the Login screen for all other
      routes.

**Dependencies:** TASK-01.

### TASK-08: Implement API client wrapper

**Description:**
Create `frontend/src/api/client.js` wrapping `fetch` calls to the backend,
including credentials (session cookie) on every request, and centralized
error handling.

**Acceptance Criteria:**
- [ ] A call through the client to `/api/v1/health` succeeds against the
      running backend.
- [ ] 401 responses from the backend trigger a redirect to the Login screen.

**Dependencies:** TASK-07, TASK-05.

### TASK-09: Wire login screen to backend

**Description:**
Connect the Login screen's form to `POST /api/v1/auth/login` via the API
client; on success, redirect to the Notes Input screen.

**Acceptance Criteria:**
- [ ] Submitting valid credentials logs in and navigates to Notes Input.
- [ ] Submitting invalid credentials shows an inline error message and does
      not navigate.

**Dependencies:** TASK-08, TASK-04.

---

## Phase 3: Feature Implementation (One Feature at a Time)

### TASK-10: Implement notes extraction (pattern + LLM fallback)

**Description:**
Implement `patternExtractor.js` (regex-based "Action Item" matching) and
`llmExtractor.js` (fallback via configured `LLM_API_KEY`/`LLM_ENDPOINT`).
Implement `POST /api/v1/notes/extract`, persisting the note and its
`action_items` rows. Wire the Notes Input screen to call this endpoint and
navigate to Review on success.

**Acceptance Criteria:**
- [ ] Notes with explicit `Action Item:` markers produce candidates tagged
      `extraction_method = 'pattern'`.
- [ ] Notes with no markers produce candidates tagged `'llm'` via the
      fallback path.
- [ ] Submitting notes from the UI navigates to the Review screen showing
      the returned candidates.

**Dependencies:** TASK-06, TASK-09.

### TASK-11: Implement candidate review (list, edit, approve/remove)

**Description:**
Implement `GET /api/v1/notes/:noteId/candidates` and
`PATCH /api/v1/candidates/:id`. Wire the Review screen to list candidates
with extraction-method badges and allow inline edit/approve/remove.

**Acceptance Criteria:**
- [ ] Editing a candidate's summary persists via `PATCH` and reflects
      immediately in the UI.
- [ ] Approving/removing a candidate updates its `status` in the database.
- [ ] "Submit Approved Items" is disabled until at least one item is
      `approved`.

**Dependencies:** TASK-10.

### TASK-12: Implement Jira ticket creation

**Description:**
Implement `jiraClient.js` (PAT-authenticated Jira API calls, mockable for
tests) and `POST /api/v1/tickets`, creating one Jira Task per approved
candidate, recording each result in `jira_tickets`, and returning
per-item `TicketResult`s with the correct batch status code.

**Acceptance Criteria:**
- [ ] Submitting approved candidates creates one Jira ticket per item in the
      configured project and issue type.
- [ ] A simulated per-item Jira API failure is reported in the response
      without aborting the rest of the batch.
- [ ] Response status is `201` (all succeed), `207` (mixed), or `422` (all
      fail), matching `specification.md` Section 5.

**Dependencies:** TASK-11.

### TASK-13: Implement Confluence page publishing

**Description:**
Implement `confluenceClient.js` and `POST /api/v1/confluence/pages`. Wire the
Confluence Draft screen to preview/edit a generated summary and publish it,
defaulting `spaceKey` to the `CONFLUENCE_SPACE_KEY` env var.

**Acceptance Criteria:**
- [ ] Publishing creates a Confluence page in the configured space and
      returns its `pageId`/`pageUrl`.
- [ ] A simulated Confluence API failure returns `status: 'failed'` with an
      `errorMessage`, without crashing the request.
- [ ] Result is recorded in the `confluence_pages` table.

**Dependencies:** TASK-11.

### TASK-14: Implement Results screen

**Description:**
Wire the Results screen to display per-item ticket/page outcomes returned
from TASK-12 and TASK-13, with success/failure counts.

**Acceptance Criteria:**
- [ ] Successful Jira tickets show a link using the returned `jiraKey`.
- [ ] Successful Confluence pages show a link using the returned `pageUrl`.
- [ ] Failed items show their `errorMessage`.

**Dependencies:** TASK-12, TASK-13.

---

## Phase 4: Integration and Testing

### TASK-15: End-to-end flow test with mocked external clients

**Description:**
Write an integration test that runs the full flow — extract → review →
approve → create tickets → publish page — using mocked `jiraClient` and
`confluenceClient` implementations (per constitution's testability
principle).

**Acceptance Criteria:**
- [ ] Test passes with all-success mocked responses.
- [ ] Test passes with a mixed success/failure mocked response and asserts
      HTTP `207` with correct per-item results.

**Dependencies:** TASK-14.

### TASK-16: Auth and CORS regression test

**Description:**
Add tests verifying unauthenticated requests to protected routes are
rejected, and cross-origin requests from an unapproved origin are blocked.

**Acceptance Criteria:**
- [ ] Test confirms all protected routes return 401 without a session.
- [ ] Test confirms `/api/v1/health` works without a session.

**Dependencies:** TASK-05.

### TASK-17: Secrets-handling audit

**Description:**
Verify no PAT, LLM key, or password ever appears in logs, database rows, or
API responses.

**Acceptance Criteria:**
- [ ] Grep of application logs after a full test run finds no PAT/API
      key/plaintext password strings.
- [ ] Database inspection confirms only `password_hash` (bcrypt) is stored
      for users, and no `jira`/`llm` credential columns exist.

**Dependencies:** TASK-15.

### TASK-18: Docker Compose smoke test

**Description:**
From a clean checkout, run `docker compose up` and verify the full stack
(frontend, backend, database) starts with no manual steps beyond providing
`.env` values.

**Acceptance Criteria:**
- [ ] `docker compose up` starts all three services successfully.
- [ ] The frontend at its exposed port can log in and complete the full flow
      against the backend and database.

**Dependencies:** TASK-15, TASK-16, TASK-17.
