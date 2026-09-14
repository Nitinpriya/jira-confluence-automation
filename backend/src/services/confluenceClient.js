const config = require('../config/env');

// Publishes a Confluence page. Mockable for tests (constitution Section 6).
async function publishConfluencePage({ title, bodyHtml, spaceKey, parentPageId }) {
  const resolvedSpaceKey = spaceKey || config.confluence.spaceKey;

  if (!config.confluence.baseUrl || !config.confluence.pat || !resolvedSpaceKey) {
    return {
      status: 'failed',
      errorMessage:
        'Confluence is not configured (missing CONFLUENCE_BASE_URL/CONFLUENCE_PAT/spaceKey)',
    };
  }

  try {
    const response = await fetch(`${config.confluence.baseUrl}/rest/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.confluence.pat}`,
      },
      body: JSON.stringify({
        type: 'page',
        title,
        space: { key: resolvedSpaceKey },
        ancestors: parentPageId ? [{ id: parentPageId }] : undefined,
        body: { storage: { value: bodyHtml, representation: 'storage' } },
      }),
    });

    if (!response.ok) {
      return {
        status: 'failed',
        errorMessage: `Confluence API returned status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      status: 'success',
      pageId: data.id,
      pageUrl: data._links ? data._links.base + data._links.webui : undefined,
    };
  } catch (err) {
    return { status: 'failed', errorMessage: err.message };
  }
}

module.exports = { publishConfluencePage };
