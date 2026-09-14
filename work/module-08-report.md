# Module 08 Completion Report

## Tracked Files
.gitignore
PROJECT_IDEAS.md
README.md
calculator.py
main.py
project_spec.md

## Spec Commit History
8e1efa2 (HEAD -> master) Add meeting notes processor technical specification

## project_spec.md Contents

```markdown
# Technical Specification: Meeting Notes Processor (Action Items → Jira Tickets)

## 1. Overview

A tool that processes Scrum meeting notes for a 4-person team on the **EPMCDMETST** project, extracts action items, presents them for manual review, and creates Jira tickets for approved items.

## 2. Goals & Audience

- **Role:** Scrum Master managing a 4-person team
- **Goal:** Eliminate manual re-entry of meeting action items into Jira, while keeping a human review step before ticket creation

## 3. Scope

- **Jira project:** `EPMCDMETST`
- **Team size:** 4 members
- **Input:** Plain text/Markdown meeting notes file, provided manually (paste or upload) — no integration with a transcript/notes tool in v1

## 4. Action Item Format

- Action items are marked with an **"Action Item"** label/prefix in the notes (e.g., lines starting with `Action Item:`)
- Exact convention to be confirmed with real sample notes during implementation, but the parser should be tolerant of minor formatting variance (e.g., `Action Item -`, `Action Item:`)

## 5. Extraction Method

Two-stage extraction, in order:

1. **Pattern/keyword matching** — scan lines for the "Action Item" marker and capture the associated text as the primary extraction method (fast, predictable, no external dependency)
2. **LLM-based fallback** — for notes where no explicit "Action Item" markers are found (or matches are sparse/ambiguous), fall back to LLM-based extraction to infer likely action items from free-form text

Each extracted item is tagged with its extraction method (`pattern` or `llm`) for transparency during review.

## 6. Review Workflow

1. Process notes → extract candidate action items (via pattern matching, then LLM fallback if needed)
2. Display extracted items to the Scrum Master in a review list (summary text, extraction method, and any parsed metadata)
3. Scrum Master confirms/edits/removes items before ticket creation
4. Only confirmed items are submitted to Jira

No auto-creation without explicit confirmation in v1.

## 7. Jira Ticket Fields

Each created ticket includes:

| Field | Source |
|---|---|
| Project | Fixed: `EPMCDMETST` |
| Issue type | Fixed: `Task` |
| Summary | Extracted action item text (as confirmed/edited by Scrum Master during review) |

Assignee, due date, and source-note linking are **out of scope for v1** (not selected as required fields).

## 8. Duplicate Handling

- Not handled in v1 — re-processing the same notes may create duplicate tickets
- No pre-check against existing Jira issues before creation

## 9. Authentication

- Jira Personal Access Token (PAT), consistent with existing project conventions
- Token supplied via `.env` (already excluded from version control), loaded as an environment variable at runtime
- Token must never be logged or printed

## 10. Execution Flow

1. Load meeting notes file (plain text/Markdown) provided by the user
2. Run pattern-matching extraction for "Action Item" markers
3. For notes with no/few pattern matches, run LLM-based fallback extraction
4. Present combined candidate list to the Scrum Master for review
5. On confirmation, create one Jira `Task` per approved item in `EPMCDMETST` with the confirmed summary text
6. Report created ticket keys back to the user

## 11. Error Handling

- Missing/invalid PAT → clear error, exit non-zero, no tickets created
- Jira API failure when creating a ticket → report which specific item failed, continue attempting remaining items, and summarize successes/failures at the end
- No action items found in notes → inform the user rather than failing silently

## 12. Out of Scope (v1)

- Automatic ticket creation without review
- Duplicate detection
- Assignee/due-date parsing from notes
- Linking tickets back to source meeting notes
- Direct integration with transcript/meeting tools (Zoom, Teams, Confluence)

## 13. Open Items for Follow-Up

- **Confirm the exact "Action Item" marker convention using real sample meeting notes**
  - *Suggestion:* Standardize on a single Markdown checkbox convention, e.g. `- [ ] Action Item: <text>`, since it is easy to regex-match, easy to type during meetings, and renders as a checklist in most Markdown viewers/Confluence.

- **Decide on the review interface (CLI prompt, simple web form, etc.) once implementation begins**
  - *Suggestion:* Start with a simple CLI prompt (numbered list, `y/n/edit` per item) since the team is only 4 people and the tool is Scrum-Master-run — lowest effort to build and matches the existing Python CLI style already used in this project (`main.py`). A web form can be a v2 enhancement if review volume grows.

- **Choose/confirm the LLM provider and API access method for the fallback extraction stage**
  - *Suggestion:* Reuse whatever LLM access your organization already has approved (e.g., GitHub Copilot/Azure OpenAI via EPAM-provided endpoints) rather than introducing a new vendor/API key, to avoid extra procurement/security review. Keep the fallback call isolated behind a single function so the provider can be swapped later with minimal changes.
```