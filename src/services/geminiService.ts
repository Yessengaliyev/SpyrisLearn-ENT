import { Flashcard, QuizQuestion } from '../types';

export const ThinkingLevel = {
  HIGH: "HIGH",
  LOW: "LOW",
  MINIMAL: "MINIMAL"
} as const;

export const Type = {
  TYPE_UNSPECIFIED: "TYPE_UNSPECIFIED",
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  OBJECT: "OBJECT",
  NULL: "NULL",
} as const;

export const Modality = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
} as const;

export const ai: any = {
  models: {
    generateContent: async (req: any) => {
      const res = await fetch('/api/gemini/generateContent', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(req) });
      if (!res.ok) { const text = await res.text(); throw new Error(text); }
      const data = await res.json();
      if (typeof data.text !== 'string' && data.candidates?.[0]?.content?.parts) {
        data.text = data.candidates[0].content.parts.map((p: any) => p.text || '').join('');
      }
      return data;
    },
    generateContentStream: async function* (req: any) {
      const res = await fetch('/api/gemini/generateContentStream', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(req) });
      if (!res.ok) {
        const text = await res.text();
        let cleanMsg = "Spyris service temporarily unavailable. Please try again in a moment.";
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) cleanMsg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
        } catch {}
        throw new Error(cleanMsg);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            const parsed = JSON.parse(data);
            if (typeof parsed.text !== 'string' && parsed.candidates?.[0]?.content?.parts) {
              parsed.text = parsed.candidates[0].content.parts.map((p: any) => p.text || '').join('');
            }
            yield parsed;
          }
        }
      }
    },
    generateVideos: async (req: any) => {
      const res = await fetch('/api/gemini/generateVideos', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(req) });
      if (!res.ok) { const text = await res.text(); throw new Error(text); }
      return res.json();
    }
  },
  operations: {
    getVideosOperation: async (req: any) => {
      const res = await fetch('/api/gemini/getVideosOperation', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(req) });
      if (!res.ok) { const text = await res.text(); throw new Error(text); }
      return res.json();
    }
  }
};

export const spyrisModel = "gemini-3.6-flash";
export const proModel = "gemini-3.6-flash";
export const liteModel = "gemini-3.6-flash";
export const veoModel = "veo-3.1-lite-generate-preview";
export const proImageModel = "gemini-3-pro-image";
export const flashImageModel = "gemini-3.1-flash-image";
export const liveModel = "gemini-3.8-live";

export const ttsModel = "gemini-3.8-flash-lite-tts";

export function decodeBase64ToText(base64: string): string {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try {
      return atob(base64);
    } catch {
      return "[Text content unreadable]";
    }
  }
}

export function processUploadedFilesForGemini(files?: { name: string, data: string, type: string }[]): { fileParts: any[], summaryText: string } {
  if (!files || files.length === 0) return { fileParts: [], summaryText: '' };
  const fileParts: any[] = [];
  const fileNames = files.map(f => f.name).join(', ');

  for (const file of files) {
    const name = file.name || 'file';
    const type = (file.type || '').toLowerCase();
    const isPdf = type === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
    const isImage = type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name);

    if (isPdf) {
      fileParts.push({
        inlineData: {
          data: file.data,
          mimeType: 'application/pdf'
        }
      });
    } else if (isImage) {
      const mime = type.startsWith('image/') ? type : 'image/jpeg';
      fileParts.push({
        inlineData: {
          data: file.data,
          mimeType: mime
        }
      });
    } else {
      let text = decodeBase64ToText(file.data);
      if (text.length > 50000) {
        text = text.slice(0, 50000) + `\n... [Файл ${name} обрезан для оптимизации]`;
      }
      fileParts.push({
        text: `\n\n--- Документ: ${name} ---\n${text}\n--- Конец документа: ${name} ---\n`
      });
    }
  }

  return { fileParts, summaryText: `Прикрепленные файлы: ${fileNames}` };
}

export async function chatWithSpyris(message: string, history: { role: string; parts: { text: string }[] }[] = [], department: string = 'General') {
  try {
    let systemInstruction = "Your name is Spyris. You are a brilliant, encouraging, and highly efficient AI study assistant for SpyrisLearn. You are multilingual and can speak and understand any language requested by the user, including Kazakh, Russian, English, and others. Always respond in the language the user is speaking to you in. CRITICAL RULE: You are an educational and UNT (Kazakhstan Unified National Testing / ҰБТ) preparation AI assistant. You must ONLY answer questions related to academics, school subjects (physics, math, chemistry, biology, history, geography, literature, law, etc.), learning, and ENT preparation. If a user asks questions outside of studies, education, or ENT (such as general chit-chat unrelated to learning, cooking, movies, games, or politics), politely decline and remind them that you are focused exclusively on academics and ENT preparation. Do NOT use markdown tables unless they are strictly necessary for comparisons, schedules, or tabular data. For normal explanations, use clear paragraphs, bullet points, and LaTeX formulas. When providing mathematical or physics formulas, ALWAYS use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$E = mc^2$$) or single dollar signs for inline math (e.g., $a^2 + b^2 = c^2$). Ensure you use backslashes (\\) for LaTeX commands, NOT forward slashes (/). Your personality is tech-forward, helpful, and energetic. IMPORTANT: Be concise and context-aware. If the user sends a simple greeting like 'hello' or 'привет', respond briefly and ask how you can help. Do not write long paragraphs unless the user asks a complex question. For all explanations, follow a structured, step-by-step approach: break down complex problems logically, explain the reasoning behind each step before the final answer, and use clear headings, numbered lists, or bullet points to separate different parts of the explanation. Keep explanations of different concepts distinct.";

    if (department === 'Marks') {
      systemInstruction += " You are currently in the 'Marks' department. When a student provides their marks for various subjects, analyze them. Identify subjects that need improvement (e.g., marks below 4 or 70%) and create a personalized study plan and specific tasks to help them improve those grades.";
    } else if (department === 'Flashcards') {
      systemInstruction += " You are currently in the 'Flashcards' department. You help students create and review flashcards.";
    } else if (department === 'Quizzes') {
      systemInstruction += " You are currently in the 'Quizzes' department. You help students test their knowledge with quizzes.";
    } else if (department === 'Plan') {
      systemInstruction += " You are currently in the 'Plan' department. Your goal is to create a comprehensive study plan for the student. Ask them what they are studying for, their timeline, and their goals, then generate a detailed schedule and study strategy.";
    } else if (department === 'Test') {
      systemInstruction += " You are currently in the 'Test' department. Your goal is to generate a multiple-choice test based on a specific subject, topic, and difficulty level (Easy, Medium, Hard). Provide 5 questions with 4 options each. After the student answers, provide feedback and the correct answers. Format the test clearly using markdown.";
    } else if (department === 'Translator') {
      systemInstruction += " You are currently in the 'Translator' department. Your goal is to translate text between any languages requested by the user, or draft messages based on the user's topic, tone, and length preferences. Provide accurate and context-aware translations or well-written drafts.";
    } else if (department === 'SmartVideos') {
      systemInstruction += " You are currently in the 'Smart Videos' department. Your goal is to find and suggest the best educational YouTube videos for a specific class level and topic. Provide direct YouTube links and a brief explanation of why each video is helpful.";
    } else if (department === 'Classroom') {
      systemInstruction += " You are in the 'Classroom' department of SpyrisLearn UNT. You assist teachers with creating UNT assignments, checking student readiness, and drafting constructive feedback or parent notices. You also assist students with solving their homework questions.";
    }

    // Truncate history to stay within token limits
    const MAX_CHARS = 100000;
    let currentChars = message.length;
    const truncatedHistory = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const msgSize = JSON.stringify(history[i]).length;
      if (currentChars + msgSize < MAX_CHARS) {
        truncatedHistory.unshift(history[i]);
        currentChars += msgSize;
      } else {
        break;
      }
    }

    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: [
        ...truncatedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const resText = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
    if (!resText) {
      throw new Error("No response from Spyris");
    }

    return resText;
  } catch (error) {
    console.error("Error in chatWithSpyris:", error);
    return "Spyris is having a bit of a brain freeze. Please check your connection or try again in a moment!";
  }
}

export async function chatWithSpyrisStream(
  message: string, 
  history: any[] = [], 
  department: string = 'General', 
  attachedImages?: { data: string, mimeType: string }[], 
  sourceUrl?: string, 
  uploadedFiles?: { name: string, data: string, type: string }[],
  isThinking: boolean = false,
  isLite: boolean = false,
  isDeepResearch: boolean = false,
  isWebSearch: boolean = false,
  isStudyMode: boolean = false
) {
  try {
    const modelToUse = (isThinking || isDeepResearch) ? proModel : (isLite ? liteModel : spyrisModel);
    
    let systemInstruction = "Your name is Spyris. You are a brilliant, encouraging, and highly efficient AI study assistant for SpyrisLearn. You are multilingual and can speak and understand any language requested by the user, including Kazakh, Russian, English, and others. Always respond in the language the user is speaking to you in. CRITICAL RULE: You are an educational and UNT (Kazakhstan Unified National Testing / ҰБТ) preparation AI assistant. You must ONLY answer questions related to academics, school subjects (physics, math, chemistry, biology, history, geography, literature, law, etc.), learning, and ENT preparation. If a user asks questions outside of studies, education, or ENT (such as general chit-chat unrelated to learning, cooking, movies, games, or politics), politely decline and remind them that you are focused exclusively on academics and ENT preparation. Do NOT use markdown tables unless they are strictly necessary for comparisons, schedules, or tabular data. For normal explanations, use clear paragraphs, bullet points, and LaTeX formulas. When providing mathematical or physics formulas, ALWAYS use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$E = mc^2$$) or single dollar signs for inline math (e.g., $a^2 + b^2 = c^2$). Ensure you use backslashes (\\) for LaTeX commands, NOT forward slashes (/). Your personality is tech-forward, helpful, and energetic. IMPORTANT: Be concise and context-aware. If the user sends a simple greeting like 'hello' or 'привет', respond briefly and ask how you can help. Do not write long paragraphs unless the user asks a complex question. For all explanations, follow a structured, step-by-step approach: break down complex problems logically, explain the reasoning behind each step before the final answer, and use clear headings, numbered lists, or bullet points to separate different parts of the explanation. Keep explanations of different concepts distinct.";

    if (isThinking) {
      systemInstruction += " You are in 'Thinking Mode'. Provide deep, step-by-step reasoning for complex academic problems. Break down the logic clearly before giving the final answer.";
    }
    if (isDeepResearch) {
      systemInstruction += " You are in 'Deep Research Mode'. Provide extremely detailed, comprehensive, and well-researched answers. Explore multiple perspectives and provide in-depth analysis.";
    }
    if (isStudyMode) {
      systemInstruction += " You are in 'Study Mode'. Focus on pedagogical methods, test the user's understanding, and provide explanations suitable for learning and retention.";
    }

    if (department === 'Marks') {
      systemInstruction += " You are currently in the 'Marks' department. When a student provides their marks for various subjects, analyze them. Identify subjects that need improvement (e.g., marks below 4 or 70%) and create a personalized study plan and specific tasks to help them improve those grades.";
    } else if (department === 'Flashcards') {
      systemInstruction += " You are currently in the 'Flashcards' department. You help students create and review flashcards.";
    } else if (department === 'Quizzes') {
      systemInstruction += " You are currently in the 'Quizzes' department. You help students test their knowledge with quizzes.";
    } else if (department === 'Plan') {
      systemInstruction += " You are currently in the 'Plan' department. Your goal is to create a comprehensive study plan for the student. Ask them what they are studying for, their timeline, and their goals, then generate a detailed schedule and study strategy.";
    } else if (department === 'Test') {
      systemInstruction += " You are currently in the 'Test' department. Your goal is to generate a multiple-choice test based on a specific subject, topic, and difficulty level (Easy, Medium, Hard). Provide 5 questions with 4 options each. After the student answers, provide feedback and the correct answers. Format the test clearly using markdown.";
    } else if (department === 'Translator') {
      systemInstruction += " You are currently in the 'Translator' department. Your goal is to translate text between any languages requested by the user, or draft messages based on the user's topic, tone, and length preferences. Provide accurate and context-aware translations or well-written drafts.";
    } else if (department === 'SmartVideos') {
      systemInstruction += " You are currently in the 'Smart Videos' department. Your goal is to find and suggest the best educational YouTube videos for a specific class level and topic. Provide direct YouTube links and a brief explanation of why each video is helpful.";
    } else if (department === 'Classroom') {
      systemInstruction += " You are in the 'Classroom' department of SpyrisLearn UNT. You assist teachers with creating UNT assignments, checking student readiness, and drafting constructive feedback or parent notices. You also assist students with solving their homework questions.";
    }

    const parts: any[] = [];
    if (attachedImages && attachedImages.length > 0) {
      attachedImages.forEach(img => {
        const mime = (img.mimeType && img.mimeType.startsWith('image/')) ? img.mimeType : 'image/jpeg';
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: mime
          }
        });
      });
    }

    const { fileParts, summaryText } = processUploadedFilesForGemini(uploadedFiles);
    if (fileParts.length > 0) {
      parts.push(...fileParts);
    }
    
    let finalMessage = (message || '').trim();
    if (!finalMessage || finalMessage.startsWith('[Attached:') || finalMessage.startsWith('[Фотоматериалы:') || finalMessage.startsWith('[Файлы:')) {
      if (department === 'conspect') {
        finalMessage = "Пожалуйста, внимательно изучи все прикрепленные материалы, фото или файлы и составь полный, структурированный конспект для подготовки к ЕНТ и учебе. Выдели главные понятия, определения, формулы и ключевые правила.";
      } else {
        finalMessage = "Пожалуйста, внимательно изучи все прикрепленные фото, изображения и документы. Объясни тему, разбери и подробно реши задания, которые там представлены, с понятными пошаговыми пояснениями.";
      }
    }

    if (sourceUrl) {
      finalMessage = `Используй контент по ссылке (${sourceUrl}) для ответа.\n\nЗапрос пользователя: ${finalMessage}`;
    }

    if (summaryText && !finalMessage.includes('Прикрепленные файлы:')) {
      finalMessage = `${summaryText}\n\nЗапрос: ${finalMessage}`;
    }

    if (finalMessage) {
      parts.push({ text: finalMessage });
    }

    // Clean up history to keep dialogue context without bloat from past images
    const MAX_HISTORY_MESSAGES = 16;
    const recentHistory = (history || []).slice(-MAX_HISTORY_MESSAGES);
    const truncatedHistory: any[] = [];

    for (const h of recentHistory) {
      const safeParts = (h.parts || []).map((p: any) => {
        // Drop heavy inlineData from older history turns to prevent massive payloads
        if (p.inlineData && p.inlineData.data && p.inlineData.data.length > 30000) {
          return { text: "[Прикрепленное ранее изображение/файл]" };
        }
        return p;
      });
      truncatedHistory.push({ role: h.role, parts: safeParts });
    }

    const tools: any[] = [];
    if (sourceUrl) {
      tools.push({ urlContext: {} });
    }
    if (isWebSearch) {
      tools.push({ googleSearch: {} });
    }

    // Retry logic for transient network errors
    let lastError;
    for (let i = 0; i < 3; i++) {
      try {
        const response = await ai.models.generateContentStream({
          model: modelToUse,
          contents: [
            ...truncatedHistory,
            { role: "user", parts }
          ],
          config: {
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            thinkingConfig: {
              thinkingLevel: isThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW
            }
          }
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        const isRetryable = i < 2 && (
          errorMsg.includes('status code: 0') ||
          errorMsg.includes('UNKNOWN') ||
          errorMsg.includes('500') ||
          errorMsg.includes('502') ||
          errorMsg.includes('503') ||
          errorMsg.includes('Server Error') ||
          errorMsg.includes('<html>') ||
          errorMsg.includes('temporarily unavailable')
        );
        if (isRetryable) {
          console.warn(`Gemini API stream attempt ${i + 1} failed (${errorMsg.slice(0, 80)}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  } catch (error) {
    console.error("Error in chatWithSpyrisStream:", error);
    throw error;
  }
}

export async function analyzeImageForConspect(images: { data: string, mimeType: string }[]) {
  try {
    const parts: any[] = images.map(img => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType || 'image/jpeg',
      },
    }));
    
    parts.push({
      text: "Analyze these images of study material. Extract the main keywords and concepts, then write a well-structured 'conspect' (summary/notes) that a student can use to study. Use clear headings and bullet points. Format it beautifully with markdown.",
    });

    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: {
        parts: parts,
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const resText = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
    if (!resText) {
      throw new Error("No response from Spyris during image analysis");
    }

    return resText;
  } catch (error) {
    console.error("Error in analyzeImageForConspect:", error);
    return "Spyris couldn't read that image. Make sure it's clear and try again!";
  }
}

export async function generateFlashcards(prompt: string, history: any[], sourceUrl?: string, uploadedFiles?: { name: string, data: string, type: string }[]): Promise<Flashcard[]> {
  try {
    // Truncate history for text conversion (reduced for speed)
    const MAX_HISTORY_CHARS = 100000;
    let historyText = "";
    let currentHistoryChars = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      const line = `${h.role}: ${h.parts.map((p: any) => p.text || '[Image]').join(' ')}\n`;
      if (currentHistoryChars + line.length < MAX_HISTORY_CHARS) {
        historyText = line + historyText;
        currentHistoryChars += line.length;
      } else {
        break;
      }
    }

    let finalPrompt = `Conversation history:\n${historyText}\n\nGenerate flashcards based on this request: "${prompt}". If no specific number is given, generate 10.`;
    
    const parts: any[] = [];
    const { fileParts, summaryText } = processUploadedFilesForGemini(uploadedFiles);
    if (fileParts.length > 0) {
      parts.push(...fileParts);
      finalPrompt = `${summaryText}\n\nPlease use the content from the attached files to generate flashcards.\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 10.`;
    } else if (sourceUrl) {
      finalPrompt = `Please use the content from this URL to generate flashcards: ${sourceUrl}\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 10.`;
    }

    parts.push({ text: finalPrompt });

    const config: any = {
      systemInstruction: "You are an expert teacher creating flashcards. Provide concise, clear fronts and backs. If no specific number is given, generate 10.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING, description: "The question or concept on the front of the flashcard." },
            back: { type: Type.STRING, description: "The answer or explanation on the back of the flashcard." }
          },
          required: ["front", "back"]
        }
      },
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    };

    if (sourceUrl) {
      config.tools = [{ urlContext: {} }];
    }

    let response;
    // Retry logic
    for (let i = 0; i < 3; i++) {
        try {
            response = await ai.models.generateContent({
                model: spyrisModel,
                contents: [
                    { role: 'user', parts }
                ],
                config
            });
            break;
        } catch (error: any) {
            if (i === 2) throw error;
            console.warn(`Flashcard generation attempt ${i + 1} failed, retrying...`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    const resText = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
    if (resText) {
      try {
        const match = resText.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
        return JSON.parse(resText);
      } catch (e) {
        console.error("Failed to parse flashcards JSON:", e, resText);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return [];
  }
}

export async function generateQuiz(prompt: string, history: any[], sourceUrl?: string, uploadedFiles?: { name: string, data: string, type: string }[]): Promise<QuizQuestion[]> {
  try {
    // Truncate history for text conversion (reduced for speed)
    const MAX_HISTORY_CHARS = 100000;
    let historyText = "";
    let currentHistoryChars = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      const line = `${h.role}: ${h.parts.map((p: any) => p.text || '[Image]').join(' ')}\n`;
      if (currentHistoryChars + line.length < MAX_HISTORY_CHARS) {
        historyText = line + historyText;
        currentHistoryChars += line.length;
      } else {
        break;
      }
    }

    let finalPrompt = `Conversation history:\n${historyText}\n\nGenerate a multiple-choice quiz based on this request: "${prompt}". If no specific number is given, generate 5 questions.`;
    
    const parts: any[] = [];
    const { fileParts, summaryText } = processUploadedFilesForGemini(uploadedFiles);
    if (fileParts.length > 0) {
      parts.push(...fileParts);
      finalPrompt = `${summaryText}\n\nPlease use the content from the attached files to generate a quiz.\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 5 questions.`;
    } else if (sourceUrl) {
      finalPrompt = `Please use the content from this URL to generate a quiz: ${sourceUrl}\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 5 questions.`;
    }

    parts.push({ text: finalPrompt });

    const config: any = {
      systemInstruction: "You are an expert teacher creating a quiz. Provide clear questions, 4 options, the correct answer index (0-3), and a brief explanation. If no specific number is given, generate 5 questions.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "The quiz question." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Exactly 4 possible answers."
            },
            correctAnswerIndex: { type: Type.INTEGER, description: "The index (0 to 3) of the correct option." },
            explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct." }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      },
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    };

    if (sourceUrl) {
      config.tools = [{ urlContext: {} }];
    }

    let response;
    // Retry logic
    for (let i = 0; i < 3; i++) {
        try {
            response = await ai.models.generateContent({
                model: spyrisModel,
                contents: [
                    { role: 'user', parts }
                ],
                config
            });
            break;
        } catch (error: any) {
            if (i === 2) throw error;
            console.warn(`Quiz generation attempt ${i + 1} failed, retrying...`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    const resText = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
    if (resText) {
      try {
        const match = resText.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
        return JSON.parse(resText);
      } catch (e) {
        console.error("Failed to parse quiz JSON:", e, resText);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
}
export async function generateVideo(prompt: string, image?: { data: string, mimeType: string }, aspectRatio: '16:9' | '9:16' = '16:9') {
  try {
    let operation = await ai.models.generateVideos({
      model: veoModel,
      prompt,
      image: image ? {
        imageBytes: image.data,
        mimeType: image.mimeType,
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    const response = await fetch(`/api/gemini/downloadVideo?url=${encodeURIComponent(downloadLink)}`);
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, size: '1K' | '2K' | '4K' = '1K', aspectRatio: '1:1' | '16:9' | '9:16' = '1:1') {
  try {
    const response = await ai.models.generateContent({
      model: proImageModel,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function editImage(baseImage: { data: string, mimeType: string }, prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: flashImageModel,
      contents: {
        parts: [
          { inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image edit failed");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}

export async function analyzeVideo(videoData: string, mimeType: string, prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: {
        parts: [
          { inlineData: { data: videoData, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    const resText = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
    return resText;
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
}

export async function transcribeAudio(audioData: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          { inlineData: { data: audioData, mimeType } },
          { text: "Transcribe this audio accurately. Only provide the transcription text." }
        ]
      }
    });
    const resText = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
    return resText;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

export async function textToSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  try {
    const response = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("No audio generated");
  } catch (error) {
    console.error("Error in textToSpeech:", error);
    throw error;
  }
}
