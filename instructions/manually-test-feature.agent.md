# Manually Test Feature

Workflow for manually testing a feature or flow against real inputs/fixtures and recording the result in a consistent, reproducible way.

- Input format:
  + The feature/flow name (e.g. "CLI review flow", "Jira ticket creation").
  + The expected behavior for that feature/flow.
  + One or more concrete test scenarios/inputs, including real sample data or fixtures — not placeholder/dummy values.
  + Relevant error-path scenarios (missing config, invalid input, external service failure), in addition to the happy path.
- Processing steps:
  + Run the feature/flow against each scenario's real input.
  + Compare the actual observed behavior to the expected behavior.
  + Note the exact input/fixture used, so the test can be reproduced later.
  + Repeat for each scenario, including error paths — do not stop after the happy-path scenario.
  + Record the result (pass/fail) for each scenario individually, not just an overall pass/fail for the feature.
- Output format:
  + One manual-test log entry per scenario with fields: Feature/Flow, Scenario, Input Used, Expected, Actual, Result (pass/fail), Notes.
  + Example checklist line: `- [x] <feature/flow> — <scenario> — expected <X>, got <Y> — pass`.
- Constraints:
  + See [`./verify-against-real-data.agent.md`](./verify-against-real-data.agent.md) — do not mark a feature as tested using only placeholder/synthetic data if real fixtures are available.
  + A feature is not "done" until both happy-path and relevant error-path scenarios have recorded results.
  + Failures must include enough detail (input, expected, actual) for someone else to reproduce them without re-deriving the test.
