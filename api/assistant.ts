import { generateText } from "ai";

export default async function handler(req: any, res: any) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { message, tasks } = req.body ?? {};

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Please enter a message." });
        }

        const result = await generateText({
            model: "openai/gpt-5.5",
            system: `You are TaskFlow AI, a helpful task management assistant.
Help users plan tasks, break work into subtasks, prioritize tasks,
and organize their day. Keep answers practical and concise.
The user's current tasks are: ${JSON.stringify(tasks ?? [])}`,
            prompt: message,
        });

        return res.status(200).json({ reply: result.text });
    } catch (error) {
        console.error("TaskFlow AI error:", error);
        return res.status(500).json({
            error: "AI assistant could not respond. Check your server configuration.",
        });
    }
}