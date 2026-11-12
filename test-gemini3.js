import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});
ai.models.generateContent({"model": "gemini-3.1-flash-preview", "contents": "hello"})
  .then(res => console.log('success'))
  .catch(err => console.error(err));
