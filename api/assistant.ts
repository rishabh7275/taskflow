import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
}

interface TaskSummary {
  title?: string;
  status?: string;
  priority?: string;
  dueDate?: number | null;
}

function getGeminiApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GOOGLE_GENERATIVE_AI_API_KEY.trim()) {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY.trim();
  }

  // Fallback for local development if process.env was not populated yet
  try {
    for (const file of [".env.local", ".env"]) {
      const fullPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const match =
          content.match(/^GEMINI_API_KEY=(.+)$/m) ||
          content.match(/^GOOGLE_GENERATIVE_AI_API_KEY=(.+)$/m);
        if (match && match[1]) {
          const val = match[1].trim().replace(/^['"]|['"]$/g, "");
          if (val) return val;
        }
      }
    }
  } catch {
    // Ignore in read-restricted environments
  }

  return undefined;
}

const CANDIDATE_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];

async function callGeminiModelWithTimeout(
  ai: GoogleGenAI,
  model: string,
  message: string,
  systemInstruction: string,
  timeoutMs = 15000
): Promise<string> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Upstream request to Gemini model '${model}' timed out after ${timeoutMs / 1000}s.`));
    }, timeoutMs);
  });

  try {
    const apiPromise = ai.models.generateContent({
      model,
      contents: message,
      config: {
        systemInstruction,
      },
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const text = response.text?.trim();
    if (!text) {
      throw new Error(`Model '${model}' returned an empty response.`);
    }
    return text;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Only POST is supported." });
  }

  const startTime = Date.now();

  try {
    const rawBody = req.body;
    const body: Record<string, unknown> =
      typeof rawBody === "string"
        ? (() => {
            try {
              return JSON.parse(rawBody);
            } catch {
              return {};
            }
          })()
        : rawBody && typeof rawBody === "object"
        ? (rawBody as Record<string, unknown>)
        : {};

    const { message, tasks } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Please enter a valid message." });
    }

    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      console.warn("[TaskFlow AI] GEMINI_API_KEY is not configured.");
      return res.status(503).json({
        error:
          "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file (and Vercel Environment Variables in production). You can get a free key at https://aistudio.google.com/app/apikey (no credit card required).",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format tasks for concise context
    const sanitizedTasks: TaskSummary[] = Array.isArray(tasks)
      ? tasks.slice(0, 50).map((t: unknown) => {
          if (t && typeof t === "object") {
            const item = t as Record<string, unknown>;
            return {
              title: typeof item.title === "string" ? item.title : "Untitled",
              status: typeof item.status === "string" ? item.status : "todo",
              priority: typeof item.priority === "string" ? item.priority : "medium",
              dueDate: typeof item.dueDate === "number" ? item.dueDate : null,
            };
          }
          return { title: "Untitled", status: "todo", priority: "medium" };
        })
      : [];

    console.log(
      `[TaskFlow AI] Incoming request: messageLength=${message.trim().length}, taskCount=${sanitizedTasks.length}`
    );

    const systemInstruction = `You are TaskFlow AI, an intelligent, helpful task management assistant integrated directly into the user's TaskFlow board.
Help the user organize their day, prioritize work, break complex tasks into actionable subtasks, and overcome procrastination.
Keep answers structured, concise, and immediately practical.

Current tasks on the user's board:
${JSON.stringify(sanitizedTasks, null, 2)}`;

    let reply = "";
    let lastError: unknown = null;

    for (const model of CANDIDATE_MODELS) {
      const modelStartTime = Date.now();
      try {
        console.log(`[TaskFlow AI] Attempting model: ${model}...`);
        reply = await callGeminiModelWithTimeout(
          ai,
          model,
          message.trim(),
          systemInstruction,
          15000
        );
        const duration = Date.now() - modelStartTime;
        console.log(`[TaskFlow AI] Model ${model} succeeded in ${duration}ms (total: ${Date.now() - startTime}ms)`);
        break;
      } catch (err) {
        lastError = err;
        const duration = Date.now() - modelStartTime;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[TaskFlow AI] Model ${model} failed after ${duration}ms: ${errMsg}`);
      }
    }

    if (!reply) {
      throw lastError || new Error("All candidate AI models failed to respond.");
    }

    return res.status(200).json({ reply });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const totalDuration = Date.now() - startTime;

    // Safe server-side error logging (never prints keys)
    console.error(`[TaskFlow AI] Request failed after ${totalDuration}ms:`, errorMsg);

    const lower = errorMsg.toLowerCase();
    if (
      lower.includes("api_key_invalid") ||
      lower.includes("api key not valid") ||
      lower.includes("invalid_argument") ||
      lower.includes("unauthorized") ||
      lower.includes("401")
    ) {
      return res.status(401).json({
        error: "Google Gemini authentication failed. Please verify that your GEMINI_API_KEY in .env.local is valid.",
      });
    }

    if (
      lower.includes("quota") ||
      lower.includes("rate limit") ||
      lower.includes("resource_exhausted") ||
      lower.includes("429")
    ) {
      return res.status(429).json({
        error: "Gemini free tier rate limit reached. Please wait a few seconds and try again.",
      });
    }

    if (lower.includes("timed out") || lower.includes("timeout")) {
      return res.status(504).json({
        error: "The AI service took too long to respond (timeout). Please try again in a moment.",
      });
    }

    return res.status(500).json({
      error: errorMsg || "AI assistant could not respond. Please try again later.",
    });
  }
}