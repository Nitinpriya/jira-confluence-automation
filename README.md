# jira-confluence-automation

Jira/Confluence automation toolkit built with AI assistance.

## Overview

This project processes Scrum meeting notes for a 4-person team on the `EPMCDMETST` Jira project, extracts action items, presents them for manual review, and creates Jira tickets for the approved items. See [work/module03-task/project_spec.md](work/module03-task/project_spec.md) for the full technical specification.

## Structure

- `instructions/` — agent/skill instruction files that drive the automation workflow.
- `work/module03-task/` — implementation of the meeting notes → Jira ticket workflow (extraction tools, calculator sample, backlog, README).
- `.vscode/mcp.json` — MCP server configuration (GitHub, Atlassian/Jira/Confluence, echo test server).
- `notes.md` — workspace notes.

## Extraction Method

Action items are extracted in two stages:

1. **Pattern/keyword matching** on the `Action Item` marker (primary method).
2. **LLM-based fallback** for notes with no or sparse pattern matches.

Each extracted item is tagged with its extraction method (`pattern` or `llm`) for transparency during review, then confirmed/edited/removed by the Scrum Master before any Jira ticket is created.

## Setup

1. Configure the MCP servers in [.vscode/mcp.json](.vscode/mcp.json) (Jira/Confluence URLs, credentials, GitHub token) when prompted by VS Code.
2. Store the Jira Personal Access Token in a local `.env` file (excluded from version control).
3. See [work/module03-task/README.md](work/module03-task/README.md) for the calculator sample module usage.
