# Use Load Notes Script

When and how to use `tools/load_notes.py` to load a meeting notes file (plain text/Markdown) for downstream action-item extraction.

- Use when:
  + You need the raw contents of a meeting notes file before running pattern-matching or LLM extraction.
  + Verifying that a notes file is readable/well-formed before wiring it into the full pipeline.
- How to run:
  + `python tools/load_notes.py --input-file <path-to-notes-file>`
  + `--input-file` is required and must point to an existing plain text/Markdown file.
- Output:
  + Prints the full file contents to stdout.
  + On a missing/unreadable file, prints an error to stderr and exits non-zero — do not treat empty stdout as "no notes found".
- Constraints:
  + Read-only: this script never modifies the notes file.
  + Do not use this script to load `.env` or credential files — see [`./use-load_jira_pat.agent.md`](./use-load_jira_pat.agent.md) for that.
