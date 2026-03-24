const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET all keywords
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('flagged_keywords')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST add a new keyword
router.post('/', async (req, res) => {
  const { keyword, category, severity } = req.body;
  if (!keyword) return res.status(400).json({ error: 'keyword is required' });

  const { data, error } = await supabase
    .from('flagged_keywords')
    .insert([{ keyword, category: category || 'general', severity: severity || 'medium' }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// PUT update a keyword
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { keyword, category, severity } = req.body;

  const { data, error } = await supabase
    .from('flagged_keywords')
    .update({ keyword, category, severity })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// DELETE a keyword
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('flagged_keywords')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Keyword deleted successfully' });
});

module.exports = router;