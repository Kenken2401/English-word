import { Router } from 'express';
import { db } from '../db.js';
import { enrichWord as enrichWordClaude } from '../services/claude.js';

const router = Router();

// GET /api/words?search=q&pos=filter
router.get('/', (req, res) => {
  try {
    const { search = '', pos = '' } = req.query;
    let query = 'SELECT * FROM words WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (word LIKE ? OR definition LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (pos) {
      query += ' AND part_of_speech = ?';
      params.push(pos);
    }

    query += ' ORDER BY word ASC';

    const words = db.prepare(query).all(...params);
    res.json(words);
  } catch (err) {
    console.error('GET /api/words error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/words/:id
router.get('/:id', (req, res) => {
  try {
    const word = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
    if (!word) return res.status(404).json({ error: 'Word not found' });
    res.json(word);
  } catch (err) {
    console.error('GET /api/words/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/words
router.post('/', async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const trimmedWord = word.trim().toLowerCase();

    // Check if word already exists
    const existing = db.prepare('SELECT * FROM words WHERE word = ? COLLATE NOCASE').get(trimmedWord);
    if (existing) {
      return res.status(409).json({ error: 'Word already exists', word: existing });
    }

    let enriched;
    try {
      enriched = await enrichWordClaude(trimmedWord);
    } catch (err) {
      if (err.status === 503) {
        return res.status(503).json({ error: err.message });
      }
      throw err;
    }

    const result = db.prepare(`
      INSERT INTO words (word, part_of_speech, definition, prepositions, grammar_notes, examples, is_default, enriched)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1)
    `).run(
      trimmedWord,
      enriched.part_of_speech,
      enriched.definition,
      JSON.stringify(enriched.prepositions),
      enriched.grammar_notes,
      JSON.stringify(enriched.examples)
    );

    const newWord = db.prepare('SELECT * FROM words WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newWord);
  } catch (err) {
    console.error('POST /api/words error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/words/:id
router.put('/:id', (req, res) => {
  try {
    const { word, part_of_speech, definition, prepositions, grammar_notes, examples } = req.body;
    const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Word not found' });

    db.prepare(`
      UPDATE words SET
        word = ?,
        part_of_speech = ?,
        definition = ?,
        prepositions = ?,
        grammar_notes = ?,
        examples = ?
      WHERE id = ?
    `).run(
      word ?? existing.word,
      part_of_speech ?? existing.part_of_speech,
      definition ?? existing.definition,
      typeof prepositions === 'object' ? JSON.stringify(prepositions) : (prepositions ?? existing.prepositions),
      grammar_notes ?? existing.grammar_notes,
      typeof examples === 'object' ? JSON.stringify(examples) : (examples ?? existing.examples),
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/words/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/words/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Word not found' });

    db.prepare('DELETE FROM words WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: `Word "${existing.word}" deleted` });
  } catch (err) {
    console.error('DELETE /api/words/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/words/:id/enrich
router.post('/:id/enrich', async (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Word not found' });

    let enriched;
    try {
      enriched = await enrichWordClaude(existing.word);
    } catch (err) {
      if (err.status === 503) {
        return res.status(503).json({ error: err.message });
      }
      throw err;
    }

    db.prepare(`
      UPDATE words SET
        part_of_speech = ?,
        definition = ?,
        prepositions = ?,
        grammar_notes = ?,
        examples = ?,
        enriched = 1
      WHERE id = ?
    `).run(
      enriched.part_of_speech,
      enriched.definition,
      JSON.stringify(enriched.prepositions),
      enriched.grammar_notes,
      JSON.stringify(enriched.examples),
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('POST /api/words/:id/enrich error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
