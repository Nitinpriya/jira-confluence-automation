require('dotenv').config();

function required(name, fallback) {
  return process.env[name] ?? fallback;
}

module.exports = {
  port: Number(process.env.PORT) || 3001,
  frontendOrigin: required('FRONTEND_ORIGIN', 'http://localhost:5173'),
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://app_user:app_password@localhost:5432/jira_confluence_automation'
  ),
  sessionSecret: required('SESSION_SECRET', 'dev-only-insecure-secret-change-me'),
  seedUsername: required('SEED_USERNAME', 'scrummaster'),
  seedPassword: process.env.SEED_PASSWORD || 'changeme123',
  jira: {
    baseUrl: process.env.JIRA_BASE_URL,
    pat: process.env.JIRA_PAT,
    projectKey: required('JIRA_PROJECT_KEY', 'EPMCDMETST'),
  },
  confluence: {
    baseUrl: process.env.CONFLUENCE_BASE_URL,
    pat: process.env.CONFLUENCE_PAT,
    spaceKey: process.env.CONFLUENCE_SPACE_KEY,
  },
  llm: {
    endpoint: process.env.LLM_ENDPOINT,
    apiKey: process.env.LLM_API_KEY,
  },
};
