const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET all history
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// DELETE a history record
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Unexpected error:', err.message);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;