const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
ai.models.generateContent({model: 'gemini-2.5-flash', contents: 'hello'})
  .then(r => console.log('OK'))
  .catch(e => console.error(e.message));
