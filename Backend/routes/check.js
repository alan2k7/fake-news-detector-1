const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabase = require('../supabaseClient');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/', async (req, res) => {
  const { news_text } = req.body;
  if (!news_text || news_text.trim() === '') {
    return res.status(400).json({ error: 'News text is required' });
  }

  try {
    // 1. Get Keywords
    const { data: keywords, error: kwError } = await supabase.from('flagged_keywords').select('*');
    if (kwError) throw kwError;

    const lowerText = news_text.toLowerCase();
    const matched = keywords.filter(k => lowerText.includes(k.keyword.toLowerCase()));

    // 2. Groq AI Analysis
    const chatCompletion = await groq.chat.completions.create({
      messages: [
  {
    role: 'system',
    content: 'You are a fast fake news detector. Respond ONLY in JSON.'
  },
  {
    role: 'user',
    content: `Analyze this news: "${news_text}". Return JSON with:
    credibility_score (0-100),
    result (FAKE, SUSPICIOUS, REAL),
    explanation (short),
    red_flags (array),
    suggestion (short)`
  }
],
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(chatCompletion.choices[0].message.content);

    // 3. Save to History
    await supabase.from('search_history').insert([{
      news_text,
      credibility_score: analysis.credibility_score,
      result: analysis.result,
      matched_keywords: matched.map(k => k.keyword)
    }]);

    res.json({ ...analysis, matched_keywords: matched.map(k => ({ keyword: k.keyword, severity: k.severity })) });
  } catch (err) {
    console.error('Check Error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;