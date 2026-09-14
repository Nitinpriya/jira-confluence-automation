# Clarification Review: Jira/Confluence Automation

Acting as a senior developer reviewing [`constitution.md`](./constitution.md)
and [`specification.md`](./specification.md) before implementation planning.
Each gap is resolved below — either answered directly (spec updated) or
explicitly marked out of scope for this prototype.

| ID | Priority | Area | Gap / Contradiction / Unclear Requirement |
|---|---|---|---|
| GAP-01 | Medium | Confluence | Target Confluence space/parent page for published pages is unspecified. |
| GAP-02 | Blocker | API contract | `/api/tickets` and `/api/confluence/pages` responses aren't fully specified per-item (status codes, partial-failure shape) — implementation can't proceed without this. |
| GAP-03 | High | Auth | No authentication/authorization model for the web app itself — anyone who can reach the backend can create tickets/pages. |
| GAP-04 | High | LLM extraction | "LLM-based fallback" names no provider, model, or invocation method. |
| GAP-05 | Blocker | Security | No spec for protecting the Jira/Confluence PAT if it's ever cached/read at runtime beyond `.env`, and no encryption-at-rest requirement for any sensitive column. |
| GAP-06 | Medium | Data model | `gen_random_uuid()` requires the `pgcrypto` (or `pgcrypto`-equivalent `uuid-ossp`/`pgcrypto` via PG15's built-in `gen_random_uuid()`) extension — not called out as a required DB setup step. |
| GAP-07 | Medium | Security | No CORS policy defined between the Vite dev server (frontend) and Express API (backend). |
| GAP-08 | Low | API contract | No versioning prefix on API routes, despite constitution requiring a "versioned REST API." |
| GAP-09 | Low | Security | No rate limiting / abuse protection specified on write endpoints (`/api/tickets`, `/api/confluence/pages`). |
| GAP-10 | Low | Observability | No logging/monitoring requirements defined for tracking extraction accuracy or API failures in production. |
| GAP-11 | Medium | Data model | `notes` table has no `updated_at`/soft-delete, and there's no size limit on `raw_text`, risking unbounded row size for large pasted notes. |
| GAP-12 | Low | UX | No pagination defined for candidate-item or notes list endpoints if a note yields many items. |

## Resolutions

### GAP-01 — Confluence target space (Answered)
Resolved by adding a required `spaceKey` (and optional `parentPageId`) field,
configured via environment variable `CONFLUENCE_SPACE_KEY`, with per-request
override allowed via the publish request body. Added to specification's data
model / API contract.

### GAP-02 — Per-item response contract (Answered — Blocker resolved)
Resolved by defining explicit response shapes for `TicketResult` and
`ConfluencePageResult`, including HTTP status semantics (`207 Multi-Status`
for partial success across a batch). Added to specification.

### GAP-03 — App authentication (Answered)
Resolved by adding a minimal session-based login (single shared team login via
username/password stored hashed in Postgres, `bcrypt`) gating all `/api`
routes except `/api/health`. Full SSO/role-based access is marked **out of
scope** for this prototype.

### GAP-04 — LLM provider (Answered)
Resolved by specifying the LLM fallback is invoked through a single
`llmExtractor` service function using the org-approved provider (configured
via `LLM_API_KEY`/`LLM_ENDPOINT` env vars), isolated behind one interface so
the provider can be swapped later — consistent with the existing
`project_spec.md` recommendation.

### GAP-05 — Secrets/encryption at rest (Answered — Blocker resolved)
Resolved: PATs and LLM keys are never persisted to PostgreSQL — they are read
from environment variables at request time only. Any future sensitive column
(none currently required) must be encrypted using **AES-256-GCM** via Node's
built-in `crypto` module, with the key supplied from an environment variable
— never stored in the database or source control.

### GAP-06 — `pgcrypto` extension (Answered)
Resolved by adding `CREATE EXTENSION IF NOT EXISTS pgcrypto;` as a required
first migration step, run automatically on container startup.

### GAP-07 — CORS policy (Answered)
Resolved by adding explicit CORS configuration on the Express app allowing
only the configured frontend origin (`FRONTEND_ORIGIN` env var, defaulting to
`http://localhost:5173` in dev).

### GAP-08 — API versioning (Answered)
Resolved by prefixing all routes with `/api/v1` (e.g. `/api/v1/notes/extract`).

### GAP-09 — Rate limiting (Marked out of scope)
Out of scope for this prototype; single small internal team, low request
volume. Revisit if the tool is exposed beyond the team.

### GAP-10 — Observability (Marked out of scope)
Out of scope for this prototype beyond basic structured console logging of
errors (already required by the constitution's error-handling principle).

### GAP-11 — Notes table constraints (Answered)
Resolved by adding `updated_at` column and a `raw_text` size limit
(`CHECK (char_length(raw_text) <= 50000)`) to `notes`.

### GAP-12 — Pagination (Marked out of scope)
Out of scope for this prototype; expected item volume per note is small
(single meeting's action items). Revisit if usage grows.
