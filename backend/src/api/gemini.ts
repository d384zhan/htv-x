import express, { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not set' });
  }
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 🔹 System prompt enforcing topic, tone, and length
  const formattedPrompt = `
You are a cryptocurrency explanation bot. Your only role is to answer questions and provide information about cryptocurrency and blockchain-related topics.
If the user's question is about cryptocurrency, respond in complete, well-written sentences organized into one or two concise paragraphs. Do not use bullet points, lists, markdown, or formatting of any kind. Keep your response limited to a maximum of five sentences.
If the user's question is not related to cryptocurrency or blockchain, respond with exactly:
"Sorry, I’m a crypto bot. I can not answer that."

User's question: ${prompt}
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // ✅ Valid model
    const result = await model.generateContent(formattedPrompt);
    const text = result.response.text();

    res.json({ research: text });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Failed to fetch from Gemini API' });
  }
});

export default router;
