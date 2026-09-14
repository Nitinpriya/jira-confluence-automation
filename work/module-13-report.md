# Module 13 Completion Report

## MCP Configuration
```json
{
  "inputs": [
    { "id": "jiraUrl", "type": "promptString", "description": "Jira base URL (e.g. https://your-company.atlassian.net)" },
    { "id": "jiraUsername", "type": "promptString", "description": "Jira account email" },
    { "id": "jiraApiToken", "type": "promptString", "description": "Jira API token", "password": true },
    { "id": "confluenceUrl", "type": "promptString", "description": "Confluence base URL (e.g. https://your-company.atlassian.net/wiki)" },
    { "id": "confluenceUsername", "type": "promptString", "description": "Confluence account email" },
    { "id": "confluenceApiToken", "type": "promptString", "description": "Confluence API token", "password": true }
  ],
  "servers": {
    "echo-windows": {
      "command": "powershell",
      "args": ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "${workspaceFolder}/.vscode/mcp-echo.ps1"]
    },
    "mcp-atlassian": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "${input:jiraUrl}",
        "JIRA_USERNAME": "${input:jiraUsername}",
        "JIRA_API_TOKEN": "${input:jiraApiToken}",
        "CONFLUENCE_URL": "${input:confluenceUrl}",
        "CONFLUENCE_USERNAME": "${input:confluenceUsername}",
        "CONFLUENCE_API_TOKEN": "${input:confluenceApiToken}"
      }
    }
  }
}
```

Note: no real API keys/tokens are stored in this file — Jira/Confluence credentials are collected at server-start time via the `inputs` prompts (token fields marked `password: true`), so there was nothing to redact.

## Configured Servers
- echo-windows
- mcp-atlassian

## MCP Tool Test
- Tool used: `mcp_echo-windows_echo` (the `echo` tool on the `echo-windows` server)
- Output:
```
Module 13 MCP tool test - hello-genai workspace
```
