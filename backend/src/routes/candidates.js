const express = require('express');
const pool = require('../db');

const router = express.Router();

router.patch('/:id', async (req, res) => {
  const { summary, status } = req.body || {};
  if (summary === undefined && status === undefined) {
    return res.status(400).json({ error: 'summary or status is required' });
  }
  if (status !== undefined && !['approved', 'removed', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'invalid status value' });
  }

  const { rows } = await pool.query(
    `UPDATE action_items
     SET summary = COALESCE($2, summary),
         status = COALESCE($3, status),
         updated_at = now()
     WHERE id = $1
     RETURNING id, summary, extraction_method, status`,
    [req.params.id, summary ?? null, status ?? null]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'candidate not found' });
  }

  res.json({ candidate: rows[0] });
});

module.exports = router;
