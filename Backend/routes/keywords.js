const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('flagged_keywords').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { keyword, category, severity } = req.body;
    const { data, error } = await supabase.from('flagged_keywords').insert([{ keyword, category, severity }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('flagged_keywords').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Keyword deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;