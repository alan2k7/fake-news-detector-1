const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const supabase = require('../supabaseClient');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/', async (req, res) => {
  const { news_text } = req.body;

  if (!news_text || news_text.trim() === '') {
    return res.status(400).json({ error: 'news_text is required' });
  }

  try {
    // 1. Fetch flagged keywords from Supabase
    const { data: keywords, error: kwError } = await supabase
      .from('flagged_keywords')
      .select('*');

    if (kwError) throw kwError;

    // 2. Find which keywords appear in the text
    const lowerText = news_text.toLowerCase();
    const matched = keywords.filter(k =>
      lowerText.includes(k.keyword.toLowerCase())
    );

    // 3. Ask Groq to analyse the news
    const prompt = `You are a fake news detection expert. Analyse the following news text and respond ONLY with a valid JSON object — no extra text, no markdown, no code fences.

News text: "${news_text}"

Flagged keywords found: ${matched.length > 0 ? matched.map(k => k.keyword).join(', ') : 'none'}

Respond with exactly this JSON structure:
{
  "credibility_score": <integer 0-100>,
  "result": "<FAKE, SUSPICIOUS, or LIKELY REAL>",
  "explanation": "<2-3 sentence explanation>",
  "red_flags": ["<flag1>", "<flag2>"],
  "suggestion": "<one sentence advice>"
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(chatCompletion.choices[0].message.content);

    // 4. Save to search_history in Supabase
    const { error: histError } = await supabase
      .from('search_history')
      .insert([{
        news_text: news_text,
        credibility_score: analysis.credibility_score,
        result: analysis.result,
        matched_keywords: matched.map(k => k.keyword)
      }]);

    if (histError) console.error('History save error:', histError.message);

    // 5. Return result
    return res.json({
      credibility_score: analysis.credibility_score,
      result: analysis.result,
      explanation: analysis.explanation,
      red_flags: analysis.red_flags || [],
      suggestion: analysis.suggestion || '',
      matched_keywords: matched.map(k => ({ keyword: k.keyword, severity: k.severity }))
    });

  } catch (err) {
    console.error('Check error:', err.message);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

module.exports = router;