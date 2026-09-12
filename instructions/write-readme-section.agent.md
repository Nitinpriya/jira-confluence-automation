# Write README Section

Workflow for writing a single, focused README section (e.g. setup, usage) from actual project code/config rather than assumptions.

- Input format:
  + The section's purpose/scope (e.g. "setup", "usage") — one section covers one purpose only.
  + The target audience (e.g. new contributor, end user running the CLI).
  + The actual commands, environment variables, prerequisites, or step-by-step flow relevant to that scope, sourced from the real project files (not invented).
- Processing steps:
  + Gather the concrete commands/steps for this section directly from the project's code, config, and dependency files.
  + Verify each command/step actually works as written before documenting it.
  + Order steps logically (e.g. prerequisites → install → configure → run).
  + Write in a direct, imperative tone — short concrete steps, not vague descriptions.
  + Keep the section scoped to its one purpose; do not mix setup instructions into a usage section or vice versa.
- Output format:
  + A Markdown section with a heading matching the section's purpose (e.g. `## Setup`, `## Usage`).
  + Ordered or bulleted steps, with fenced code blocks for any commands.
- Constraints:
  + Every documented command/step must have been verified to work, not assumed.
  + State prerequisites explicitly (e.g. required env vars, tokens, dependencies) before the steps that need them.
  + Avoid vague instructions ("configure the tool") — be specific and testable ("set `JIRA_PAT` in `.env`").
