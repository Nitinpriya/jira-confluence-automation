const config = require('../config/env');

// Stage 2 fallback (clarify.md GAP-04): isolated so the provider can be swapped later.
// Requires LLM_ENDPOINT/LLM_API_KEY; without them, throws a clear, spec-mandated error
// rather than silently returning fabricated results.
async function extractByLlm(notesText) {
  if (!config.llm.endpoint || !config.llm.apiKey) {
    const error = new Error(
      'LLM fallback extraction is not configured (missing LLM_ENDPOINT/LLM_API_KEY)'
    );
    error.code = 'LLM_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(config.llm.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({ notesText }),
  });

  if (!response.ok) {
    const error = new Error(`LLM provider request failed with status ${response.status}`);
    error.code = 'LLM_REQUEST_FAILED';
    throw error;
  }

  const data = await response.json();
  return Array.isArray(data.items) ? data.items : [];
}

module.exports = { extractByLlm };
