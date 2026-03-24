require('dotenv').config();
const express = require('express');
const cors = require('cors');

// These lines are updated to look in the current folder (./)
const checkRoute = require('./routes/check');
const keywordsRoute = require('./routes/keywords'); 
const historyRoute = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/check', checkRoute);
app.use('/api/keywords', keywordsRoute);
app.use('/api/history', historyRoute);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Fake News Checker API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});