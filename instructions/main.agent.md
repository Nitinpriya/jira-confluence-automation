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
