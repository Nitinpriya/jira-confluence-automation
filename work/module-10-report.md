# Module 10 Completion Report

## Instruction Files

```
    Directory: C:\Workspace\hello-genai\instructions

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          12-09-2026    20:31           1173 create-status-report.agent.md
-a---          12-09-2026    20:39          16828 creating-instructions.agent.md
-a---          12-09-2026    20:59           2899 main.agent.md
-a---          12-09-2026    20:59           1707 manually-test-feature.agent.md
-a---          12-09-2026    20:59           1530 tag-extracted-items.agent.md
-a---          12-09-2026    20:59            764 verify-against-real-data.agent.md
-a---          12-09-2026    20:59           1544 write-readme-section.agent.md
```

## main.agent.md Contents

```markdown
---
description: "Main orchestrator agent — routes tasks to specialized subagents, delegating weekly status report requests to create-status-report."
name: "main"
tools: [read, edit, search, agent]
agents: [create-status-report]
user-invocable: true
---
You are the main orchestrator agent. Your job is to handle general requests and delegate specialized tasks to the appropriate subagent.

## Constraints
- DO NOT write a status report yourself.
- ONLY hand off status report requests to the `create-status-report` subagent.

## Approach
1. When a request is about generating, updating, or reviewing a weekly status report, hand off to `create-status-report`.
2. For all other requests, handle them directly.
3. Return the subagent's output to the user without unnecessary rephrasing.

## Output Format
Whatever format the invoked subagent (or the direct task) produces.

---

# Instructions Catalog

Each entry below is an instruction file with a one-line description. Optional
sub-fields after `+`:
- **Keywords** — trigger words/phrases: if user's request matches, load this instruction.
- **Target** — file glob pattern: if current file or context matches, consider this
  instruction relevant.
- **Exceptions** — edge cases or clarifications that don't fit in the one-liner.

---

- [`./instructions/creating-instructions.agent.md`](./creating-instructions.agent.md) — how to create/update instructions, skills, and IDE wrappers in this project.
  + Keywords: create instruction, new instruction, skill, catalog, bootstrap instructions
- [`./instructions/create-status-report.agent.md`](./create-status-report.agent.md) — VS Code custom subagent that writes weekly status reports (Accomplishments/Blockers/Next Week).
  + Keywords: status report, weekly update, accomplishments, blockers
- [`./instructions/tag-extracted-items.agent.md`](./tag-extracted-items.agent.md) — attach an extraction-method tag (e.g. pattern/llm) to items pulled out by multiple extractors.
  + Keywords: tag, extraction method, pattern, llm, extractor
- [`./instructions/manually-test-feature.agent.md`](./manually-test-feature.agent.md) — manually test a feature/flow against real fixtures and log pass/fail results per scenario.
  + Keywords: manually test, manual test, test scenario, pass fail, error path
- [`./instructions/write-readme-section.agent.md`](./write-readme-section.agent.md) — write one focused README section (setup, usage, etc.) from verified project facts.
  + Keywords: README, setup instructions, usage instructions, documentation
- [`./instructions/verify-against-real-data.agent.md`](./verify-against-real-data.agent.md) — shared rule: only treat something as done when checked against real evidence, not assumptions; flag ambiguity instead of guessing.
  + Keywords: verify, real data, don't assume, placeholder, ambiguous
```

## Sample Instruction
- File: `instructions/tag-extracted-items.agent.md`
- Contents:

```markdown
# Tag Extracted Items

Workflow for attaching an extraction-method tag to items produced by multiple extractors (e.g. pattern-matching vs. LLM fallback), so downstream steps can tell how each item was found.

- Input format:
  + A list of extracted items (e.g. action items, entities), each already associated with the extractor/pass that produced it.
  + The name/identifier of that extractor (e.g. `pattern`, `llm`, `manual`).
- Processing steps:
  + Define a small controlled vocabulary of extraction-method values up front (e.g. `pattern`, `llm`) — do not invent new values ad hoc per item.
  + Iterate over each extracted item and attach a `method`/`extraction_method` field set to the value matching its originating extractor.
  + Never overwrite or alter the item's original text/content while tagging.
  + Merge all tagged items from every extractor into a single combined list, preserving each item's tag.
- Output format:
  + The same item objects/strings, each annotated with an explicit extraction-method tag.
  + A single combined list ready for downstream review/consumption.
- Constraints:
  + Every item must carry exactly one method tag — no untagged items in the output.
  + Tag values must come from the predefined vocabulary, not free text.
  + See [`./verify-against-real-data.agent.md`](./verify-against-real-data.agent.md) — an item's origin must be based on real extractor evidence; if ambiguous or unmatched, flag it explicitly rather than guessing a tag or silently dropping it.
```
