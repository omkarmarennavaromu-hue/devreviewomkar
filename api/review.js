// api/review.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Please send code and language' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const prompt = `You are DevReview AI. Analyze this ${language} code and return ONLY JSON:
    {
      "score": 0-10,
      "score_reason": "",
      "bugs": [],
      "improvements": [],
      "complexity": {"time":"","space":"","explanation":""},
      "security": [],
      "optimized_code": "",
      "summary": ""
    }
    Code:
    ${code}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content;

    if (!result) return res.status(502).json({ error: 'AI returned nothing' });

    res.status(200).json({ review: result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
