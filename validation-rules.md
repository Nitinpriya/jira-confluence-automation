# Validation Rules

Checks to run against files in this repository before treating a change as done.

## 1. Markdown files (`*.md`)
- Must start with a single `#` H1 title matching the file's purpose (no duplicate H1s).
- Relative links (e.g. `[backlog.md](./backlog.md)`) must point to a file that actually exists in the repo — verify with a file search before leaving the link in place.

## 2. Agent/instruction files (`*.agent.md`, `SKILL.md`)
- Must have valid YAML frontmatter (`---` delimited) with at minimum a `description` field; `.agent.md` files also need `name`.
- Referenced tool/agent names in frontmatter (`tools:`, `agents:`) must match tools/agents that actually exist.

## 3. Backlog / task-tracking files (e.g. `backlog.md`)
- Checklist items must use consistent syntax: `- [ ]` (open) or `- [x]` (done) — no mixed bullet styles.
- Any `(issue #N)` reference must correspond to a real, currently-open-or-closed issue number in the linked GitHub repo, not a guessed number.

## 4. Config/credential files (`.env`, `mcp.json`, etc.)
- No plaintext secrets, tokens, or passwords committed — sensitive values must come from environment variables or prompted inputs.
- `.env` (or equivalent secret file) must be listed in `.gitignore`.

## 5. Code files (`*.py`, etc.)
- New functions/classes referenced in a README or spec must actually exist in the source — don't document behavior that isn't implemented.
- No hard-coded credentials, API keys, or PATs in source code.

## 6. Generated reports (e.g. `module-*-report.md`)
- Data pasted into a report (file contents, issue tables, tool lists) must be copied verbatim from a live read of the source — not paraphrased or reconstructed from memory.
