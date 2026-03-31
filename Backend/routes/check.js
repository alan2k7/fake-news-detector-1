const express = require('express');
const router = express.Router();
const cache = new Map();
const Groq = require('groq-sdk');
const supabase = require('../supabaseClient');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
router.post('/', async (req, res) => {
  console.log("🔥 API HIT");
  const { news_text } = req.body;
  // 🔍 Trusted sources
const trustedSources = [
  "bbc",
  "ndtv",
  "reuters",
  "cnn",
  "the hindu",
  "times of india",
  "indian express",
  "al jazeera"
];

const isTrusted = trustedSources.some(src =>
  news_text.toLowerCase().includes(src)
);

// ❌ Fake usage of trusted sources
const fakeSourcePatterns = [
  "bbc claims",
  "bbc hiding",
  "ndtv exposed",
  "reuters hiding",
  "cnn not showing",
  "media won't show",
  "government hiding truth",
  "mainstream media lies"
];

const suspiciousSource = fakeSourcePatterns.some(p =>
  news_text.toLowerCase().includes(p)
);

  if (!news_text || news_text.trim() === '') {
    return res.status(400).json({ error: 'News text is required' });
  }

  if (cache.has(news_text)) {
    console.log("⚡ Cache hit");
    return res.json(cache.get(news_text));
  }

  try {
    console.log("👉 Fetching keywords...");
    // 1. Get Keywords
   const keywords = [
  { keyword: "fake", severity: "high" },
  { keyword: "shocking", severity: "medium" }
];

    const lowerText = news_text.toLowerCase();
    const matched = keywords.filter(k => lowerText.includes(k.keyword.toLowerCase()));

    console.log("🤖 Calling Groq...");
    // 2. Groq AI Analysis
const chatCompletion = await Promise.race([
  groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are an intelligent fake news detector.

RULES:
- Mentioning BBC, NDTV, Reuters does NOT guarantee truth
- People can misuse trusted sources in fake news
- Do NOT mark news as fake just because of strong words like war, attack
- Focus on whether the claim itself is misleading or false

Respond ONLY in JSON.`
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
    max_tokens: 120,
    temperature: 0.2,
    response_format: { type: 'json_object' }
  }),

  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Groq timeout")), 5000)
  )
]);
let analysis;
try {
  analysis = JSON.parse(chatCompletion.choices[0].message.content);
} catch (e) {
  analysis = {
    credibility_score: 50,
    result: "UNKNOWN",
    explanation: "AI response parsing failed",
    red_flags: [],
    suggestion: "Try again"
  };
}

    // 3. Save to History
    await supabase.from('search_history').insert([{
      news_text,
      credibility_score: analysis.credibility_score,
      result: analysis.result,
      matched_keywords: matched.map(k => k.keyword)
    }]);

  let finalResult = { ...analysis };

// ✅ small boost if trusted
if (isTrusted) {
  finalResult.credibility_score += 10;
}

// ❌ penalty if fake usage
if (suspiciousSource) {
  finalResult.credibility_score -= 20;
}

// keep score between 0–100
finalResult.credibility_score = Math.max(0, Math.min(100, finalResult.credibility_score));

const result = {
  ...finalResult,
  matched_keywords: matched.map(k => ({
    keyword: k.keyword,
    severity: k.severity
  }))
};

cache.set(news_text, result);

console.log("✅ Sending response")
res.json(result);
  } catch (err) {
    console.error('Check Error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;