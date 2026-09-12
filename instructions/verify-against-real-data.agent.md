# Verify Against Real Data

Shared rule reused by workflows that produce or judge a deliverable (a tag, a test result, a documentation section): treat something as correct/done only when checked against real, concrete evidence — never placeholders, assumptions, or guesses.

- Only use real inputs, fixtures, commands, or data as the basis for a decision — placeholder/synthetic/assumed values are not sufficient evidence of correctness.
- Actually execute/run/check the thing before declaring it correct, tested, or documented — do not infer correctness from what "should" happen.
- If real evidence is ambiguous, incomplete, or missing, flag it explicitly (e.g. "needs manual review", "unverified") rather than guessing or silently marking it done.
