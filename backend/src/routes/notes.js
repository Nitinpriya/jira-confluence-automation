const express = require('express');
const pool = require('../db');
const { extractByPattern } = require('../services/patternExtractor');
const { extractByLlm } = require('../services/llmExtractor');

const router = express.Router();

router.post('/extract', async (req, res) => {
  const { notesText } = req.body || {};
  if (!notesText || typeof notesText !== 'string') {
    return res.status(400).json({ error: 'notesText is required' });
  }

  const noteResult = await pool.query(
    'INSERT INTO notes (raw_text) VALUES ($1) RETURNING id',
    [notesText]
  );
  const noteId = noteResult.rows[0].id;

  let summaries = extractByPattern(notesText);
  let extractionMethod = 'pattern';

  if (summaries.length === 0) {
    try {
      summaries = await extractByLlm(notesText);
      extractionMethod = 'llm';
    } catch (err) {
      // No action items found and LLM fallback unavailable — report rather than fail silently.
      return res.status(200).json({
        noteId,
        candidates: [],
        warning: `No pattern matches found and LLM fallback failed: ${err.message}`,
      });
    }
  }

  const candidates = [];
  for (const summary of summaries) {
    const { rows } = await pool.query(
      `INSERT INTO action_items (note_id, summary, extraction_method)
       VALUES ($1, $2, $3) RETURNING id, summary, extraction_method, status`,
      [noteId, summary, extractionMethod]
    );
    candidates.push(rows[0]);
  }

  res.status(201).json({ noteId, candidates });
});

router.get('/:noteId/candidates', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, summary, extraction_method, status FROM action_items WHERE note_id = $1 ORDER BY created_at',
    [req.params.noteId]
  );
  res.json({ candidates: rows });
});

module.exports = router;
