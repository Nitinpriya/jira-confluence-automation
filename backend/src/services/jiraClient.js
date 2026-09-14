const config = require('../config/env');

// Creates one Jira Task per action item summary. Mockable for tests (constitution Section 6).
async function createJiraTicket(summary) {
  if (!config.jira.baseUrl || !config.jira.pat) {
    return {
      status: 'failed',
      errorMessage: 'Jira is not configured (missing JIRA_BASE_URL/JIRA_PAT)',
    };
  }

  try {
    const response = await fetch(`${config.jira.baseUrl}/rest/api/2/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.jira.pat}`,
      },
      body: JSON.stringify({
        fields: {
          project: { key: config.jira.projectKey },
          issuetype: { name: 'Task' },
          summary,
        },
      }),
    });

    if (!response.ok) {
      return {
        status: 'failed',
        errorMessage: `Jira API returned status ${response.status}`,
      };
    }

    const data = await response.json();
    return { status: 'success', jiraKey: data.key };
  } catch (err) {
    return { status: 'failed', errorMessage: err.message };
  }
}

module.exports = { createJiraTicket };
