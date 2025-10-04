import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import geminiRoutes from './api/gemini.js';
dotenv.config();

console.log("Gemini API Key:", process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/gemini', geminiRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));