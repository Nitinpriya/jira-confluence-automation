# Validate Markdown Files

When and how to use `scripts/validate_markdown.py` to check every Markdown file in the repo for consistent formatting (Rule 1 in [`../validation-rules.md`](../validation-rules.md)).

- Use when:
  + You've added/edited `.md` files and want to confirm they follow repo formatting rules before committing.
  + Doing a repo-wide documentation health check (many files, consistency matters — Approach 3).
- How to run:
  + `python scripts/validate_markdown.py` (no arguments; scans the whole repo from its own location).
  + Optional `--path <dir>` to scan a subdirectory instead of the whole repo.
- Checks performed per file:
  + Exactly one top-level `#` H1 title, counted only outside fenced code blocks (fenced blocks may contain sample Markdown with their own `#` headers and must not trigger false positives).
  + Files with YAML frontmatter (`---` at the top) and files under `.github/` are exempt from the H1 check — their frontmatter/short directive text serves as the title by repo convention.
  + Every relative Markdown link (`[text](path)`) resolves to a file that actually exists on disk relative to the linking file; absolute URLs (`http(s)://`) and in-page anchors (`#section`) are skipped; link syntax shown as an inline-code example (e.g. `` `[text](path)` ``) is stripped before checking, so it isn't flagged as a broken link.
- Output:
  + Prints one line per file: `OK <path>` or `FAIL <path>: <reason>`.
  + Exits non-zero if any file fails, so it can be wired into a pre-commit check later.
- Constraints:
  + Read-only: never modifies the Markdown files it scans.
  + Skips `.git/`, `__pycache__/`, and other non-content directories.
  + If a check flags a false positive (e.g. a legitimately duplicated H1 inside a fenced code sample), refine the script's fence-tracking logic rather than ignoring the finding.
