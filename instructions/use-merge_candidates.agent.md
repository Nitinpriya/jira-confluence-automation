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
