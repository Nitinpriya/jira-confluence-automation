# Feature Specification: Jira/Confluence Automation

## 1. Overview

A web application that helps a Scrum Master (or team lead) turn team activity —
meeting notes and review decisions — into Jira tickets and Confluence pages,
with a mandatory human review step before anything is written to Jira or
Confluence.

This specification expands on [`constitution.md`](./constitution.md) and must
stay consistent with its fixed tech stack, security, and quality principles.
All open questions raised during review are resolved in
[`clarify.md`](./clarify.md) and incorporated below.

## 1a. Authentication (resolved in clarify.md GAP-03)

- Single shared team login (username/password, `bcrypt`-hashed in Postgres).
- All `/api/v1/*` routes require an authenticated session except
  `/api/v1/health`.
- Full SSO / per-user roles are out of scope for this prototype.

## 2. Target User & Problem

- **User:** Scrum Master managing a small team (e.g. 4 people).
- **Problem today:** Action items captured in meeting notes are manually
  re-typed into Jira, and related summaries/decisions are manually copied into
  Confluence — slow and error-prone.
- **Goal:** Paste/upload meeting notes once, review AI-extracted candidate
  items in a web UI, and on confirmation, automatically create Jira tickets
  and/or Confluence documentation pages.

## 3. User Stories

1. **As a Scrum Master**, I can paste or upload a meeting notes file so that
   the system can extract candidate action items automatically.
2. **As a Scrum Master**, I can see each extracted candidate item along with
   how it was extracted (pattern match vs. LLM fallback), so I can judge its
   reliability before acting on it.
3. **As a Scrum Master**, I can edit, remove, or approve each candidate item
   individually before any ticket or page is created.
4. **As a Scrum Master**, I can confirm approved items to create Jira tasks in
   a configured project, so I don't have to manually re-enter them.
5. **As a Scrum Master**, I can generate a Confluence summary page from the
   same reviewed notes (e.g. meeting minutes), so documentation stays in sync
   with what was discussed.
6. **As a Scrum Master**, I can see a per-item success/failure result after
   submission, so I know which tickets/pages were created and which failed
   and why.
7. **As a Scrum Master**, I never want the system to write to Jira/Confluence
   without my explicit confirmation.

## 4. UI Screens

1. **Notes Input Screen**
   - Textarea for pasting notes, or file upload (`.txt`/`.md`).
   - "Extract Action Items" button.
2. **Review Screen**
   - List of candidate items, each showing: summary text, extraction method
     badge (`pattern` / `llm`), inline edit field, and "Approve" / "Remove"
     controls.
   - "Submit Approved Items" button (disabled until at least one item is
     approved).
3. **Confluence Draft Screen**
   - Auto-generated draft summary (editable) built from the reviewed notes.
   - "Publish to Confluence" button.
4. **Results Screen**
   - Per-item status list: created Jira ticket key (linked) or Confluence page
     link on success; error message on failure.
   - Summary counts (created / failed).

## 5. API Endpoints

All endpoints are served by the Express backend under `/api/v1` (see
GAP-08). CORS is restricted to the `FRONTEND_ORIGIN` env var (GAP-07). All
routes except `/api/v1/health` and `/api/v1/auth/login` require an
authenticated session (GAP-03).

| Method | Path | Request Body | Response | Purpose |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `{ username: string, password: string }` | `{ ok: true }` (sets session cookie) | Authenticate the shared team login |
| `POST` | `/api/v1/notes/extract` | `{ notesText: string }` | `{ candidates: CandidateItem[] }` | Run pattern + LLM-fallback extraction on submitted notes |
| `GET` | `/api/v1/notes/:noteId/candidates` | — | `{ candidates: CandidateItem[] }` | Retrieve previously extracted candidates for a stored note |
| `PATCH` | `/api/v1/candidates/:id` | `{ summary?: string, status?: 'approved'|'removed' }` | `{ candidate: CandidateItem }` | Edit or set review decision on one candidate |
| `POST` | `/api/v1/tickets` | `{ candidateIds: string[] }` | `207 Multi-Status`: `{ results: TicketResult[] }` | Create Jira tickets for approved candidates; per-item success/failure |
| `POST` | `/api/v1/confluence/pages` | `{ noteId: string, title: string, bodyHtml: string, spaceKey?: string, parentPageId?: string }` | `{ page: ConfluencePageResult }` | Publish a Confluence page from the reviewed draft (defaults `spaceKey` to `CONFLUENCE_SPACE_KEY` env var, GAP-01) |
| `GET` | `/api/v1/health` | — | `{ status: 'ok' }` | Health check for Docker/orchestration (no auth required) |

### Response Shapes (resolved in clarify.md GAP-02)

```ts
type TicketResult = {
  actionItemId: string;
  status: 'success' | 'failed';
  jiraKey?: string;        // present when status === 'success'
  errorMessage?: string;   // present when status === 'failed'
};

type ConfluencePageResult = {
  status: 'success' | 'failed';
  pageId?: string;
  pageUrl?: string;
  errorMessage?: string;
};
```

`POST /api/v1/tickets` returns HTTP `207 Multi-Status` whenever the batch
contains a mix of successes and failures, `201 Created` when all succeed, and
`422 Unprocessable Entity` when all fail.

## 6. Data Model (PostgreSQL)

```sql
-- Required once per database (resolved in clarify.md GAP-06)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared team login credential (resolved in clarify.md GAP-03)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,      -- bcrypt hash, never plaintext
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One uploaded/pasted meeting notes submission
CREATE TABLE notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text     TEXT NOT NULL CHECK (char_length(raw_text) <= 50000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Candidate action items extracted from a note
CREATE TABLE action_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id           UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  summary           TEXT NOT NULL,
  extraction_method TEXT NOT NULL CHECK (extraction_method IN ('pattern', 'llm')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'removed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Result of attempting to create a Jira ticket for an action item
CREATE TABLE jira_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id  UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  jira_key        TEXT,                     -- e.g. EPMCDMETST-123, null if failed
  status           TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Result of publishing a Confluence page from a note
CREATE TABLE confluence_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id      UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  page_id      TEXT,                        -- Confluence page ID, null if failed
  page_url     TEXT,
  status       TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 7. Out of Scope (v1)

- Duplicate detection across repeated note submissions.
- Automatic (non-reviewed) ticket/page creation.
- Direct integration with transcript/meeting tools (Zoom, Teams).
- Assignee/due-date inference for Jira tickets.
- Full SSO / per-user roles and permissions (GAP-03).
- Rate limiting on write endpoints (GAP-09).
- Structured observability/monitoring beyond console error logging (GAP-10).
- Pagination on list endpoints (GAP-12).

## 8. Resolved Questions

See [`clarify.md`](./clarify.md) for the full gap analysis and resolutions
(GAP-01 through GAP-12), all of which are reflected in the sections above.
