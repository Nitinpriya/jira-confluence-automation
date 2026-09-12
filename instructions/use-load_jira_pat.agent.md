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
