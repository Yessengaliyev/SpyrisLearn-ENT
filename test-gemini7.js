import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});
async function test() {
  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-flash-latest',
      contents: 'Hello',
      apiKey: 'invalid_key_override_from_body_lmao'
    });
    for await (const chunk of stream) {
      console.log(chunk.text);
    }
  } catch (err) {
    console.error(err.message);
  }
}
test();
