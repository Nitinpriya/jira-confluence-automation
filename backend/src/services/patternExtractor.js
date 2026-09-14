// Stage 1 extraction: regex match on "Action Item" markers (spec Section 5, project_spec.md convention).
const ACTION_ITEM_PATTERN = /^\s*(?:-\s*\[.\]\s*)?action item\s*[:\-]\s*(.+)$/i;

function extractByPattern(notesText) {
  const lines = notesText.split(/\r?\n/);
  const matches = [];
  for (const line of lines) {
    const match = line.match(ACTION_ITEM_PATTERN);
    if (match && match[1].trim().length > 0) {
      matches.push(match[1].trim());
    }
  }
  return matches;
}

module.exports = { extractByPattern };
