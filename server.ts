import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { WebSocketServer } from 'ws';
import { GoogleGenAI } from "@google/genai";

const distPath = path.join(process.cwd(), "dist");

const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/surge.db' : 'surge.db';
const db = new Database(dbPath);
const JWT_SECRET = process.env.JWT_SECRET || "surge-secret-key";

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    achievements TEXT DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    data TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());
  app.use(cors());

  // Mock OTP Store
  const otps = new Map<string, string>();
  const verifiedEmails = new Set<string>();

  // Auth Routes
  app.post("/api/auth/send-code", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email or phone is required" });
    
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(email, code);
    
    // In a production app, you would use Twilio or SendGrid here.
    // For this demo, we return the code so the frontend can display it to the user.
    res.json({ success: true, message: "Code sent successfully", mockCode: code });
  });

  app.post("/api/auth/verify-code", (req, res) => {
    const { email, code } = req.body;
    if (otps.get(email) === code) {
      otps.delete(email);
      verifiedEmails.add(email);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid verification code" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    
    if (!verifiedEmails.has(email)) {
      return res.status(400).json({ error: "Email not verified. Please verify your email first." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)").run(id, email, hashedPassword, name);
      
      verifiedEmails.delete(email); // Clean up after signup
      
      const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: { id, email, name } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user: any = db.prepare("SELECT id, email, name, xp, level, achievements FROM users WHERE id = ?").get(decoded.id);
      res.json({ user });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.post("/api/achievements", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const { achievements } = req.body;
      db.prepare("UPDATE users SET achievements = ? WHERE id = ?").run(JSON.stringify(achievements), decoded.id);
      res.json({ success: true });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Experience Routes
  app.post("/api/experience", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const { xp, level } = req.body;
      db.prepare("UPDATE users SET xp = ?, level = ? WHERE id = ?").run(xp, level, decoded.id);
      res.json({ success: true });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Session Routes
  app.get("/api/sessions", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const rows = db.prepare("SELECT data FROM sessions WHERE user_id = ?").all(decoded.id);
      const sessions = rows.map((row: any) => JSON.parse(row.data));
      res.json({ sessions });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.post("/api/sessions", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const { sessions } = req.body;
      
      // Simple sync: delete all and re-insert or update
      // For a real app, we'd do something more granular
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(decoded.id);
      const insert = db.prepare("INSERT INTO sessions (id, user_id, data) VALUES (?, ?, ?)");
      
      for (const session of sessions) {
        insert.run(session.id, decoded.id, JSON.stringify(session));
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Gemini AI Server Proxy with shared client and retry
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err?.stack || err || "");
        const isRetryable = attempt < maxRetries && (
          msg.includes("500") ||
          msg.includes("502") ||
          msg.includes("503") ||
          msg.includes("504") ||
          msg.includes("Server Error") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("overloaded") ||
          msg.includes("<html>") ||
          msg.includes("fetch failed") ||
          msg.includes("ECONNRESET")
        );
        if (isRetryable) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async function generateContentWithFallback(body: any) {
    try {
      return await executeWithRetry(() => ai.models.generateContent(body));
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      const isQuotaOrServerErr = 
        msg.includes("429") || 
        msg.includes("RESOURCE_EXHAUSTED") || 
        msg.includes("Quota exceeded") || 
        msg.includes("500") || 
        msg.includes("Server Error") || 
        msg.includes("<html>");

      if (isQuotaOrServerErr && body.model !== "gemini-3.1-flash-lite") {
        const fallbackBody = { ...body, model: "gemini-3.1-flash-lite" };
        if (fallbackBody.config?.thinkingConfig) {
          fallbackBody.config = { ...fallbackBody.config, thinkingConfig: { thinkingLevel: 'MINIMAL' } };
        }
        return await executeWithRetry(() => ai.models.generateContent(fallbackBody));
      }
      throw err;
    }
  }

  async function generateContentStreamWithFallback(body: any) {
    try {
      return await executeWithRetry(() => ai.models.generateContentStream(body));
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      const isQuotaOrServerErr = 
        msg.includes("429") || 
        msg.includes("RESOURCE_EXHAUSTED") || 
        msg.includes("Quota exceeded") || 
        msg.includes("500") || 
        msg.includes("Server Error") || 
        msg.includes("<html>");

      if (isQuotaOrServerErr && body.model !== "gemini-3.1-flash-lite") {
        const fallbackBody = { ...body, model: "gemini-3.1-flash-lite" };
        if (fallbackBody.config?.thinkingConfig) {
          fallbackBody.config = { ...fallbackBody.config, thinkingConfig: { thinkingLevel: 'MINIMAL' } };
        }
        return await executeWithRetry(() => ai.models.generateContentStream(fallbackBody));
      }
      throw err;
    }
  }

  function prepareGeminiBody(rawBody: any) {
    const body = { ...rawBody };
    if (!body.model) body.model = "gemini-3.8-flash";
    if (!body.config) body.config = {};

    // gemini-3.8-flash, gemini-4-argon, gemini-4-carbon do NOT support ThinkingLevel.MINIMAL (causes 400 error)
    const isGemini38Or4 = body.model.includes("3.8") || body.model.includes("4-");
    if (isGemini38Or4) {
      if (body.config.thinkingConfig?.thinkingLevel === 'MINIMAL') {
        body.config.thinkingConfig = { thinkingLevel: 'LOW' };
      }
    } else if (!body.config.thinkingConfig && body.model.includes("flash-lite")) {
      body.config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
    }
    return body;
  }

  app.post("/api/gemini/generateContent", async (req, res) => {
    try {
      const body = prepareGeminiBody(req.body);
      const response = await generateContentWithFallback(body);
      let responseText = "";
      try {
        responseText = response.text || "";
      } catch {
        responseText = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || "";
      }

      res.json({
        ...response,
        text: responseText,
      });
    } catch (error: any) {
      console.error("Error in /api/gemini/generateContent:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/generateContentStream", async (req, res) => {
    try {
      const body = prepareGeminiBody(req.body);
      const responseStream = await generateContentStreamWithFallback(body);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      for await (const chunk of responseStream) {
        let chunkText = "";
        try {
          chunkText = chunk.text || "";
        } catch {
          chunkText = chunk.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || "";
        }
        res.write(`data: ${JSON.stringify({ ...chunk, text: chunkText })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error("Error in /api/gemini/generateContentStream:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/generateVideos", async (req, res) => {
    try {
      const response = await executeWithRetry(() => ai.models.generateVideos(req.body));
      res.json(response);
    } catch (error: any) {
      console.error("Error in /api/gemini/generateVideos:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/getVideosOperation", async (req, res) => {
    try {
      const response = await executeWithRetry(() => ai.operations.getVideosOperation(req.body));
      res.json(response);
    } catch (error: any) {
      console.error("Error in /api/gemini/getVideosOperation:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/gemini/downloadVideo", async (req, res) => {
    try {
      const { url } = req.query;
      const apiKey = process.env.GEMINI_API_KEY || "";
      const response = await fetch(url as string, {
        headers: { 'x-goog-api-key': apiKey }
      });
      if (!response.ok) throw new Error("Failed to download video");
      res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Error in /api/gemini/downloadVideo:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(distPath)));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

  wss.on('connection', async (clientWs) => {
    try {
      let session: any = null;

      clientWs.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'connect') {
            session = await ai.live.connect({
              model: msg.model,
              config: msg.config,
              callbacks: {
                onmessage: (serverMsg) => {
                  if (clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(JSON.stringify(serverMsg));
                  }
                },
                onclose: () => {
                  if (clientWs.readyState === clientWs.OPEN) clientWs.close();
                },
                onerror: (e) => {
                  console.error("Live API error", e);
                  if (clientWs.readyState === clientWs.OPEN) clientWs.close();
                }
              }
            });
            clientWs.send(JSON.stringify({ type: 'ready' }));
          } else if (msg.type === 'audio' && session) {
            session.sendRealtimeInput({
              audio: { data: msg.data, mimeType: msg.mimeType }
            });
          }
        } catch (e) {
          console.error("Error handling WS message:", e);
        }
      });

      clientWs.on('close', () => {
        // cleanup if needed
      });
    } catch (e) {
      console.error("Error setting up WS connection:", e);
      clientWs.close();
    }
  });
}

startServer();
