import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ 
  apiKey: "invalid_key",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});
async function test() {
  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: 'Hello'
    });
    for await (const chunk of stream) {
      console.log(chunk.text);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
