# Module 17 Completion Report

## Specification Contents
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

## Commit History
674eba9 (HEAD -> main, origin/main) Mod17-Checklist and Final Verification
1231b3a docs: add spec/tasks analysis and module 16 environment report
4f254a5 feat: add PostgreSQL 15 via Docker Compose with initial schema (TASK-03)
02bdf7f feat: scaffold frontend (Vite+React18) and backend (Express) per TASK-01/TASK-02
6d4dcd8 docs: clarify gaps, update spec, add implementation plan and tasks
7c2aef7 docs: add SpecKit constitution and specification for Jira/Confluence automation
7bc15fc chore: project skeleton for prototype
9bdbad8 Add Module 15 completion report
67ea8f4 Add Markdown validation script + instruction; fix missing fences in module-08/09 reports
5a95622 Update module03-task submodule reference
adf701a Add validation rules for repository file types
170bf41 Fix validation issues: sync backlog checkbox with issue #6 state, use verbatim issue titles in module-14 report
927e3a1 Update module03-task submodule reference
669b970 Update mcp.json and add module-13 report
a9ccb67 Add project README
ddb8b46 Add Jira/Confluence MCP server config and annotate backlog tasks with MCP/custom skill
b5ebe68 Add get_time and calculate tools to MCP echo server
5b0c8da Add MCP echo server config and PowerShell script
fcbedc8 Add module 12 completion report
4ac0635 Update module03-task subproject pointer to include new tools scripts
7d78438 Add usage instructions for tools scripts and register them in catalog
0329f5c Add module 10 completion report
bcfc611 Extract shared verify-against-real-data instruction; reference it from tag/test/readme instructions
dba641b Add tag-extracted-items, manually-test-feature, write-readme-section instructions
c25c96f Add instructions infrastructure (Copilot entry point, catalog, creating-instructions guide)
21171ce Add module 09 completion report
855f024 Update module03-task submodule reference
0c3e31b Initial commit

## Commit Count
28

## Project Files
.github/copilot-instructions.md
.github/prompts/to-create-instruction.prompt.md
.gitignore
.vscode/mcp-echo.ps1
.vscode/mcp.json
.vscode/settings.json
README.md
backend/index.js
backend/package-lock.json
backend/package.json
backend/src/config/env.js
backend/src/db.js
backend/src/middleware/auth.js
backend/src/routes/auth.js
backend/src/routes/candidates.js
backend/src/routes/notes.js
backend/src/seed.js
backend/src/services/confluenceClient.js
backend/src/services/jiraClient.js
backend/src/services/llmExtractor.js
backend/src/services/patternExtractor.js
db/init/001_init_schema.sql
docker-compose.yml
frontend/.gitignore
frontend/.oxlintrc.json
frontend/README.md
frontend/index.html
frontend/package-lock.json
frontend/package.json
frontend/public/favicon.svg
frontend/public/icons.svg
frontend/src/App.css
frontend/src/App.jsx
frontend/src/assets/hero.png
frontend/src/assets/react.svg
frontend/src/assets/vite.svg
frontend/src/index.css
frontend/src/main.jsx
frontend/vite.config.js
instructions/create-status-report.agent.md
instructions/creating-instructions.agent.md
instructions/main.agent.md
instructions/manually-test-feature.agent.md
instructions/tag-extracted-items.agent.md
instructions/use-load_jira_pat.agent.md
instructions/use-load_notes.agent.md
instructions/use-merge_candidates.agent.md
instructions/validate-markdown.agent.md
instructions/verify-against-real-data.agent.md
instructions/write-readme-section.agent.md
notes.md
package-lock.json
package.json
scripts/validate_markdown.py
spec/analyze.md
spec/checklist.md
spec/clarify.md
spec/constitution.md
spec/plan.md
spec/specification.md
spec/tasks.md
validation-rules.md
work/module-03-report.md
work/module-08-report.md
work/module-09-report.md
work/module-10-report.md
work/module-12-report.md
work/module-13-report.md
work/module-14-report.md
work/module-15-report.md
work/module-16-report.md
work/module03-task
work/module08-task/.env.example
work/module08-task/README.md
work/module08-task/backend/package.json
work/module08-task/backend/src/config/env.js
work/module08-task/backend/src/routes/notes.js
work/module08-task/backend/src/routes/tickets.js
work/module08-task/backend/src/server.js
work/module08-task/backend/src/services/jiraClient.js
work/module08-task/backend/src/services/llmExtractor.js
work/module08-task/backend/src/services/patternExtractor.js
work/module08-task/backend/tests/.gitkeep
work/module08-task/docker-compose.yml
work/module08-task/docker/.gitkeep
work/module08-task/frontend/package.json
work/module08-task/frontend/public/index.html
work/module08-task/frontend/src/App.jsx
work/module08-task/frontend/src/index.jsx
work/module08-task/frontend/src/api/client.js
work/module08-task/frontend/src/components/CandidateList.jsx
work/module08-task/frontend/src/components/NotesUploader.jsx
work/module08-task/frontend/src/components/ReviewItem.jsx