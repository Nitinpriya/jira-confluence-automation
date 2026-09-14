const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

module.exports = app;
