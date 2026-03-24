const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');-

// GET all history
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE a history record
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('search_history')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Record deleted successfully' });
});

module.exports = router;