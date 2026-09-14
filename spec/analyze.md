# Analysis: Jira/Confluence Automation

Cross-check of [`specification.md`](./specification.md), [`plan.md`](./plan.md),
and [`tasks.md`](./tasks.md) against [`constitution.md`](./constitution.md)
and [`clarify.md`](./clarify.md).

## 1. Per-Task Complexity, Risk, and Dependencies

| Task | Complexity | Key Risk(s) | Dependencies (as stated) |
|---|---|---|---|
| TASK-01 Initialize frontend (Vite+React 18) | Low | Minimal — scaffold only | None |
| TASK-02 Initialize backend (Express) | Low | Minimal — scaffold only | None |
| TASK-03 Stand up PostgreSQL via Docker Compose | Medium | No migration tool specified (see ANALYZE-01); schema drift if run manually | None |
| TASK-04 Session-based login | Medium | Seed-credential provisioning undefined (ANALYZE-04); session store backend not chosen (ANALYZE-02) | TASK-02, TASK-03 |
| TASK-05 Auth middleware and CORS | Medium | Must correctly exempt `/health` and `/auth/login`; misconfigured CORS is a security gap | TASK-04 |
| TASK-06 Stub remaining API routes | Low | Low complexity, but easy to forget one of the 6 endpoints | TASK-05 |
| TASK-07 Client-side routing and screens | Medium | Login screen not listed in spec's UI Screens section — ambiguity on its design (ANALYZE-05) | TASK-01 |
| TASK-08 API client wrapper | Low-Medium | Must handle cookies + 401 redirect consistently across all calls | TASK-07, TASK-05 |
| TASK-09 Wire login screen to backend | Low | Depends on TASK-04 credential scheme being finalized first | TASK-08, TASK-04 |
| TASK-10 Notes extraction (pattern + LLM) | High | LLM provider/endpoint contract still abstract (clarify.md GAP-04 only partially resolved — no concrete provider chosen, see ANALYZE-03); external call latency/failure handling | TASK-06, TASK-09 |
| TASK-11 Candidate review (list/edit/approve) | Medium | Concurrent edits to same candidate not addressed (no optimistic locking) | TASK-10 |
| TASK-12 Jira ticket creation | High | Real external API integration; per-item partial failure semantics must exactly match `207/201/422` contract | TASK-11 |
| TASK-13 Confluence page publishing | High | Real external API integration; space/parent-page permissions untested until live | TASK-11 |
| TASK-14 Results screen | Low | Simple read-only rendering of prior results | TASK-12, TASK-13 |
| TASK-15 E2E test with mocked clients | Medium | Requires stable mock/fixture design for Jira/Confluence clients; no test framework chosen yet (ANALYZE-06) | TASK-14 |
| TASK-16 Auth/CORS regression test | Low-Medium | Straightforward but depends on TASK-05 being complete and stable | TASK-05 |
| TASK-17 Secrets-handling audit | Medium | Manual/log-grep based — no automated secret-scanning tool specified | TASK-15 |
| TASK-18 Docker Compose smoke test | High | Aggregates all prior risk; blocked if frontend/backend lack Dockerfiles (ANALYZE-07) | TASK-15, TASK-16, TASK-17 |

**Overall risk concentration:** Phase 3 (TASK-10, 12, 13) carries the highest
complexity because it's the only phase touching real external systems
(LLM provider, Jira, Confluence) whose concrete integration details are still
underspecified.

## 2. Gaps, Contradictions, and Missing Artifacts

| ID | Severity | Finding |
|---|---|---|
| ANALYZE-01 | Medium | **Missing artifact:** No migration tool/framework is specified for TASK-03 (e.g. `node-pg-migrate`, Knex, or plain SQL run on container init). `plan.md`/`tasks.md` assume "a migration script" exists without naming how it's authored or run. |
| ANALYZE-02 | Medium | **Missing artifact:** TASK-04 requires "session/cookie auth" but no session store is chosen (e.g. `express-session` + `connect-pg-simple` vs. in-memory, which won't survive backend restarts/scaling). Constitution's statelessness principle (Section 4) is arguably in tension with server-side session storage — needs an explicit decision. |
| ANALYZE-03 | High | **Gap carried over from clarify.md GAP-04, not fully closed:** `llmExtractor.js` still has no concrete provider/model named — `specification.md` and `tasks.md` (TASK-10) reference `LLM_API_KEY`/`LLM_ENDPOINT` generically. This blocks TASK-10 from being implemented without a follow-up decision. |
| ANALYZE-04 | Medium | **Missing artifact:** TASK-04's seed user has no defined source for its initial username/password (hardcoded seed vs. env-var-provisioned). Hardcoding would violate the constitution's "never hard-coded... credentials" principle (Section 5) since a password is a credential. |
| ANALYZE-05 | Medium | **Contradiction:** `specification.md` Section 4 ("UI Screens") lists only 4 screens (Notes Input, Review, Confluence Draft, Results) but Section 1a (Authentication) requires a login flow, and `tasks.md` TASK-07/09 implement a Login screen. The Login screen is missing from the authoritative UI Screens list. |
| ANALYZE-06 | Medium | **Missing artifact:** No task establishes the testing framework/tooling (e.g. Jest/Vitest + Supertest) before TASK-15/16 rely on it. |
| ANALYZE-07 | High | **Missing artifact / plan gap:** The constitution (Section 4) requires "every service (frontend, backend, database) must run in Docker," but `tasks.md` Phase 0 only stands up PostgreSQL in Docker (TASK-03); no task creates Dockerfiles or Compose service entries for `frontend`/`backend`. This blocks TASK-18 (Docker Compose smoke test), which assumes all three services are already containerized. |
| ANALYZE-08 | Low | **Contradiction:** `plan.md` Phase 2 goal says "routing between the four screens," but per ANALYZE-05 there are actually 5 screens (including Login) once auth is accounted for. |
| ANALYZE-09 | Low | **Minor inconsistency:** `jira_tickets` and `confluence_pages` tables have `created_at` but no `updated_at`, unlike `notes`/`action_items`/`users`. Likely intentional (result rows are write-once), but not explicitly stated as a design decision. |
| ANALYZE-10 | Low | **Doc inconsistency:** `constitution.md` Section 7 references a `plan/` directory, but the actual convention established by `plan.md`/`tasks.md`/`clarify.md` is flat files directly under `spec/` (e.g. `spec/plan.md`). Section 7 wording should be updated to match. |
| ANALYZE-11 | Low | **Missing artifact:** No task defines `.env.example` contents (env var names required: `DATABASE_URL`, `SESSION_SECRET`, `JIRA_PAT`, `CONFLUENCE_SPACE_KEY`, `LLM_API_KEY`, `LLM_ENDPOINT`, `FRONTEND_ORIGIN`, `PORT`) even though `constitution.md`, `specification.md`, and `clarify.md` collectively reference all of them. |

## 3. Recommendations

1. Resolve **ANALYZE-07** first (containerize frontend/backend) since it
   blocks the plan's own Phase 4 exit criteria.
2. Resolve **ANALYZE-03** (LLM provider) and **ANALYZE-02** (session store)
   before starting TASK-10 and TASK-04 respectively — both are currently too
   abstract to implement without another decision pass.
3. Fix **ANALYZE-05/ANALYZE-08** by adding the Login screen to
   `specification.md` Section 4 and correcting `plan.md`'s "four screens"
   wording to five.
4. Add a lightweight task (or fold into TASK-01/TASK-02) to pick and install
   a test framework (**ANALYZE-06**) and author `.env.example`
   (**ANALYZE-11**) before Phase 3 begins.
5. Remaining items (ANALYZE-01, 04, 09, 10) are low-to-medium severity and
   can be resolved inline during implementation of their respective tasks,
   but should not be silently decided without updating the spec.
