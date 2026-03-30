require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express(); 

app.use(cors({
  origin: '*'
}));

app.use(express.json());

const checkRoute = require('./routes/check');
const keywordsRoute = require('./routes/keywords');
const historyRoute = require('./routes/history');

const PORT = process.env.PORT || 3000;


app.use(express.json());

// API Routes
app.use('/api/check', checkRoute);
app.use('/api/keywords', keywordsRoute);
app.use('/api/history', historyRoute);

// Serve Frontend static files
app.use(express.static(path.join(__dirname, '../Frontend')));

// SPA routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;