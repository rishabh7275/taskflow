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
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string | null;
  labels?: string[];
  subtasks?: { title: string; completed: boolean }[];
  estimatedTime?: string;
  notes?: string;
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

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

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

    const { message, tasks, mode } = body;

    const queryMessage = typeof message === "string" ? message.trim() : "";
    const isPlannerMode =
      mode === "planner" ||
      /plan my day|what should i do first|analyze my pending tasks|daily plan|make a plan/i.test(queryMessage);

    if (!queryMessage && !isPlannerMode) {
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

    // Format tasks for comprehensive planning context
    const sanitizedTasks: TaskSummary[] = Array.isArray(tasks)
      ? tasks.slice(0, 50).map((t: unknown) => {
          if (t && typeof t === "object") {
            const item = t as Record<string, unknown>;
            const labels = Array.isArray(item.labels)
              ? item.labels
                  .map((l: unknown) =>
                    l && typeof l === "object" && "name" in l
                      ? String((l as { name: unknown }).name).trim()
                      : ""
                  )
                  .filter(Boolean)
              : [];
            const subtasks = Array.isArray(item.subtasks)
              ? item.subtasks
                  .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
                  .map((s) => ({
                    title: typeof s.title === "string" ? s.title.slice(0, 100).trim() : "",
                    completed: Boolean(s.completed),
                  }))
                  .filter((s) => s.title)
              : [];

            return {
              title: typeof item.title === "string" && item.title.trim() ? item.title.slice(0, 150).trim() : "Untitled",
              description:
                typeof item.description === "string" && item.description.trim()
                  ? item.description.slice(0, 300).trim()
                  : undefined,
              status: typeof item.status === "string" ? item.status : "todo",
              priority: typeof item.priority === "string" ? item.priority : "medium",
              dueDate: typeof item.dueDate === "string" && item.dueDate.trim() ? item.dueDate.trim() : null,
              labels: labels.length > 0 ? labels : undefined,
              subtasks: subtasks.length > 0 ? subtasks : undefined,
              estimatedTime:
                typeof item.estimatedTime === "string" && item.estimatedTime.trim()
                  ? item.estimatedTime.slice(0, 50).trim()
                  : undefined,
              notes: typeof item.notes === "string" && item.notes.trim() ? item.notes.slice(0, 300).trim() : undefined,
            };
          }
          return { title: "Untitled", status: "todo", priority: "medium", dueDate: null };
        })
      : [];

    const pendingTasks = sanitizedTasks.filter((t) => t.status !== "done");

    // If planner requested and there are no tasks at all or no pending tasks, return helpful friendly response
    if (isPlannerMode && sanitizedTasks.length === 0) {
      return res.status(200).json({
        reply:
          "### 📋 No Tasks Found\n\nYour board does not have any tasks yet! To generate an AI Smart Plan:\n1. Click **New Task** or load demo data from **Data Tools**.\n2. Add titles, priorities, and due dates.\n3. Re-run **AI Smart Planner** to receive your custom daily schedule and priorities.",
      });
    }

    if (isPlannerMode && pendingTasks.length === 0) {
      return res.status(200).json({
        reply:
          "### 🎉 All Caught Up!\n\nAll tasks on this board are already marked as **Done**! You have no pending items for today.\n\n- **Great job finishing your work!**\n- If you have new goals for today, add them using **New Task** and re-run the planner whenever you're ready.",
      });
    }

    const todayDate = new Date().toISOString().split("T")[0];

    console.log(
      `[TaskFlow AI] Incoming request: message="${queryMessage}", taskCount=${sanitizedTasks.length}, pendingCount=${pendingTasks.length}, isPlanner=${isPlannerMode}`
    );

    const systemInstruction = `You are TaskFlow AI Smart Planner, an intelligent, practical, and highly organized task planning assistant.
Today's date is ${todayDate} (ISO format YYYY-MM-DD).

Current tasks on user's active board:
${JSON.stringify(sanitizedTasks, null, 2)}

ROLE & BEHAVIORAL RULES:
1. When asked to plan the day, prioritize tasks, or when mode is "planner", organize your response into these 4 clear sections:
   ### 1. Today's Priorities
   Identify the top 2-3 most critical tasks to tackle first today based on priority (high > medium > low), status, and due dates.
   ### 2. Recommended Task Order
   Provide a sequential, step-by-step order to complete the pending tasks, explaining briefly why each task should be tackled in that order.
   ### 3. Deadline Warnings
   Highlight any overdue tasks (dueDate < "${todayDate}" and status is not "done") and tasks due today ("${todayDate}") or approaching soon. If all deadlines are in the clear, explicitly state so.
   ### 4. Suggested Next Steps
   Provide actionable steps for complex tasks (mentioning subtasks if available). Include a realistic suggested schedule only when estimated times are available. Clearly highlight tasks that can reasonably be postponed to avoid cognitive overload.

2. ACCURACY & DATA INTEGRITY:
- Base all analysis strictly on the tasks provided above.
- NEVER invent deadlines, completion status, estimated durations, or fake tasks.
- If information like time estimate or due date is absent, state that no deadline or estimate was specified.
- Clearly state any assumptions.
- You are an advisory planner: you must NEVER claim or imply that you have modified, created, completed, or deleted any task in the user's database.`;

    const promptMessage =
      queryMessage ||
      "Please analyze my current tasks and generate my daily smart plan following the 4 required sections.";

    let reply = "";
    let lastError: unknown = null;

    for (const model of CANDIDATE_MODELS) {
      const modelStartTime = Date.now();
      try {
        console.log(`[TaskFlow AI] Attempting model: ${model}...`);
        reply = await callGeminiModelWithTimeout(
          ai,
          model,
          promptMessage,
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