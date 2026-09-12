# Module 12 Completion Report

Three instruction/script pairs were created in this module.

## Pair 1: Load Notes

### Instruction File
- Filename: `instructions/use-load_notes.agent.md`

```markdown
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
```

### Script File
- Filename: `work/module03-task/tools/load_notes.py`
- Language: Python

```python
"""Load a meeting notes file (plain text/Markdown) and print its contents.

Create a Python script at tools/load_notes.py that loads meeting notes from
a plain text/Markdown file and prints the content to stdout. Accept
--input-file as a command-line argument.
"""
import argparse
import sys


def load_notes(input_file: str) -> str:
    with open(input_file, "r", encoding="utf-8") as f:
        return f.read()


def main():
    parser = argparse.ArgumentParser(description="Load a meeting notes file (txt/Markdown).")
    parser.add_argument("--input-file", required=True, help="Path to the meeting notes file")
    args = parser.parse_args()

    try:
        contents = load_notes(args.input_file)
    except OSError as e:
        print(f"Error: could not read '{args.input_file}': {e}", file=sys.stderr)
        sys.exit(1)

    print(contents)


if __name__ == "__main__":
    main()
```

### Script Execution Output

```
$ python tools\load_notes.py --help
usage: load_notes.py [-h] --input-file INPUT_FILE

Load a meeting notes file (txt/Markdown).

options:
  -h, --help            show this help message and exit
  --input-file INPUT_FILE
                        Path to the meeting notes file
```

---

## Pair 2: Load Jira PAT

### Instruction File
- Filename: `instructions/use-load_jira_pat.agent.md`

```markdown
# Use Load Jira PAT Script

When and how to use `tools/load_jira_pat.py` to validate that the Jira Personal Access Token is configured, without ever exposing its value.

- Use when:
  + Confirming `.env` is set up correctly before running Jira ticket creation.
  + Diagnosing "missing/invalid PAT" errors reported by the main tool.
- How to run:
  + `python tools/load_jira_pat.py --env-file <path-to-.env> --var-name <env-var-name>`
  + `--env-file` defaults to `.env`; `--var-name` defaults to `JIRA_API_TOKEN` (this project's actual `.env` variable name).
- Output:
  + Prints a success message with the token's character count only — never the token value itself.
  + On a missing/empty variable, prints an error to stderr and exits non-zero.
- Constraints:
  + Never log, print, or echo the PAT value in this script or in any output derived from it.
  + Use only to check presence/validity of the token — actual Jira authentication happens in the main tool, not here.
```

### Script File
- Filename: `work/module03-task/tools/load_jira_pat.py`
- Language: Python

```python
"""Load the Jira Personal Access Token from a .env file and confirm it is present.

Create a Python script at tools/load_jira_pat.py that loads the Jira PAT from
a .env file as an environment variable and validates that it is set, without
ever logging or printing the token value. Accept --env-file (default: .env)
and --var-name (default: JIRA_API_TOKEN) as command-line arguments.
"""
import argparse
import os
import sys

from dotenv import load_dotenv


def load_pat(env_file: str, var_name: str) -> str | None:
    load_dotenv(dotenv_path=env_file)
    return os.environ.get(var_name)


def main():
    parser = argparse.ArgumentParser(description="Load and validate the Jira PAT from a .env file.")
    parser.add_argument("--env-file", default=".env", help="Path to the .env file")
    parser.add_argument("--var-name", default="JIRA_API_TOKEN", help="Environment variable name holding the PAT")
    args = parser.parse_args()

    pat = load_pat(args.env_file, args.var_name)

    if not pat:
        print(f"Error: '{args.var_name}' is missing or empty in '{args.env_file}'", file=sys.stderr)
        sys.exit(1)

    # Confirm presence only; the token value itself is never printed.
    print(f"'{args.var_name}' loaded successfully ({len(pat)} characters).")


if __name__ == "__main__":
    main()
```

### Script Execution Output

```
$ python tools\load_jira_pat.py --help
usage: load_jira_pat.py [-h] [--env-file ENV_FILE] [--var-name VAR_NAME]

Load and validate the Jira PAT from a .env file.

options:
  -h, --help           show this help message and exit
  --env-file ENV_FILE  Path to the .env file
  --var-name VAR_NAME  Environment variable name holding the PAT
```

---

## Pair 3: Merge Candidates

### Instruction File
- Filename: `instructions/use-merge_candidates.agent.md`

```markdown
# Use Merge Candidates Script

When and how to use `tools/merge_candidates.py` to combine pattern-matched and LLM-extracted action items into one tagged candidate list for review.

- Use when:
  + Both the pattern-matching extractor and the LLM fallback extractor have produced results for the same notes and need to be combined before the CLI review step.
  + Rebuilding a combined candidate list after re-running one of the two extractors.
- How to run:
  + `python tools/merge_candidates.py --pattern-file <path.json> --llm-file <path.json> --output-file <path.json>`
  + Each input file is a JSON list of items — either plain strings or `{"text": ...}` objects.
- Output:
  + Writes a JSON list to `--output-file`, where each entry is `{"text": ..., "method": "pattern"|"llm"}`.
  + Prints a summary count of merged candidates written.
- Constraints:
  + Preserves extraction-method tagging per [`./tag-extracted-items.agent.md`](./tag-extracted-items.agent.md) — pattern items tagged `pattern`, LLM items tagged `llm`.
  + Does not de-duplicate entries between the two sources — v1 scope has no dedup (see backlog).
  + On malformed input JSON, prints an error to stderr and exits non-zero rather than writing a partial output file.
```

### Script File
- Filename: `work/module03-task/tools/merge_candidates.py`
- Language: Python

```python
"""Merge pattern-matched and LLM-extracted action items into one candidate list.

Create a Python script at tools/merge_candidates.py that merges the
pattern-matching extraction results and the LLM fallback extraction results
into a single combined candidate list, tagging each item with its extraction
method (pattern/llm). Accept --pattern-file and --llm-file (JSON files, each
a list of item strings or {"text": ...} objects) and --output-file as
command-line arguments.
"""
import argparse
import json
import sys


def load_items(path: str) -> list:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [item["text"] if isinstance(item, dict) else item for item in data]


def merge_candidates(pattern_file: str, llm_file: str) -> list:
    candidates = []
    for text in load_items(pattern_file):
        candidates.append({"text": text, "method": "pattern"})
    for text in load_items(llm_file):
        candidates.append({"text": text, "method": "llm"})
    return candidates


def main():
    parser = argparse.ArgumentParser(description="Merge pattern and LLM extraction results into one candidate list.")
    parser.add_argument("--pattern-file", required=True, help="JSON file with pattern-matched items")
    parser.add_argument("--llm-file", required=True, help="JSON file with LLM-extracted items")
    parser.add_argument("--output-file", required=True, help="Path to write the merged JSON candidate list")
    args = parser.parse_args()

    try:
        candidates = merge_candidates(args.pattern_file, args.llm_file)
    except (OSError, json.JSONDecodeError) as e:
        print(f"Error: could not build candidate list: {e}", file=sys.stderr)
        sys.exit(1)

    with open(args.output_file, "w", encoding="utf-8") as f:
        json.dump(candidates, f, indent=2)

    print(f"Wrote {len(candidates)} combined candidates to '{args.output_file}'.")


if __name__ == "__main__":
    main()
```

### Script Execution Output

```
$ python tools\merge_candidates.py --help
usage: merge_candidates.py [-h] --pattern-file PATTERN_FILE
                           --llm-file LLM_FILE --output-file OUTPUT_FILE

Merge pattern and LLM extraction results into one candidate list.

options:
  -h, --help            show this help message and exit
  --pattern-file PATTERN_FILE
                        JSON file with pattern-matched items
  --llm-file LLM_FILE   JSON file with LLM-extracted items
  --output-file OUTPUT_FILE
                        Path to write the merged JSON candidate list
```
