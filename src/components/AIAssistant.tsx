import { useState, useRef, useEffect, type FormEvent } from "react";
import { useTaskStore } from "../store";
import {
    Box,
    Button,
    Fab,
    IconButton,
    Paper,
    TextField,
    Typography,
    CircularProgress,
    Avatar,
} from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";

type ChatMessage = {
    role: "user" | "assistant";
    text: string;
    isError?: boolean;
};

export default function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
    const tasks = useTaskStore((s) => s.tasks);

    const abortControllerRef = useRef<AbortController | null>(null);
    const isSubmittingRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            text: "Hi! I am your TaskFlow AI Assistant. I can help you plan your day, prioritize tasks, and break big tasks into smaller steps. What would you like help with?",
        },
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (open) {
            scrollToBottom();
        }
    }, [messages, loading, open]);

    // Clean up active abort controller on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const sendMessage = async (event?: FormEvent, retryText?: string) => {
        event?.preventDefault();

        const messageToSend = (retryText ?? input).trim();
        // Prevent duplicate message submissions or sending while active
        if (!messageToSend || loading || isSubmittingRef.current) return;

        isSubmittingRef.current = true;
        setLoading(true);

        if (!retryText) {
            setMessages((previous) => [
                ...previous,
                { role: "user", text: messageToSend },
            ]);
            setInput("");
        }
        setLastFailedMessage(null);

        // Abort previous request if still pending
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // 20-second timeout with AbortController
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 20000);

        try {
            console.log(`[TaskFlow AI] Sending prompt (${messageToSend.length} chars) with ${tasks.length} tasks...`);
            const response = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: messageToSend, tasks }),
                signal: controller.signal,
            });

            const contentType = response.headers.get("content-type") || "";
            const rawText = await response.text();

            let data: { reply?: string; error?: string } = {};
            if (rawText && contentType.includes("application/json")) {
                try {
                    data = JSON.parse(rawText);
                } catch {
                    data = { error: "Received malformed JSON response from AI service." };
                }
            } else if (rawText) {
                data = { error: rawText };
            }

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(
                        "AI Assistant endpoint (/api/assistant) was not found. Please ensure the dev server is running."
                    );
                }
                throw new Error(
                    data.error ||
                        `AI request failed with status ${response.status} (${response.statusText || "Server Error"}).`
                );
            }

            if (!data.reply) {
                throw new Error("The AI assistant returned an empty response. Please try again.");
            }

            setMessages((previous) => [
                ...previous,
                { role: "assistant", text: data.reply as string },
            ]);
            setLastFailedMessage(null);
        } catch (error: unknown) {
            const isAbort = error instanceof Error && error.name === "AbortError";
            console.error("[TaskFlow AI] Request failed:", isAbort ? "Timed out after 20s" : error);

            const errorMsg = isAbort
                ? "TaskFlow AI request timed out after 20 seconds. Please check your network or click Retry."
                : error instanceof Error
                ? error.message
                : "I could not connect to the AI service. Please check the backend configuration and deployment.";

            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    text: errorMsg,
                    isError: true,
                },
            ]);
            setLastFailedMessage(messageToSend);
        } finally {
            clearTimeout(timeoutId);
            abortControllerRef.current = null;
            isSubmittingRef.current = false;
            setLoading(false);
        }
    };

    return (
        <>
            <Fab
                color="primary"
                aria-label="Open AI Assistant"
                onClick={() => setOpen((previous) => !previous)}
                sx={{
                    position: "fixed",
                    right: 24,
                    bottom: 24,
                    zIndex: (theme) => theme.zIndex.modal + 1,
                }}
            >
                {open ? <CloseRoundedIcon /> : <SmartToyRoundedIcon />}
            </Fab>

            {open && (
                <Paper
                    elevation={12}
                    sx={{
                        position: "fixed",
                        right: { xs: 12, sm: 24 },
                        bottom: { xs: 88, sm: 92 },
                        width: { xs: "calc(100vw - 24px)", sm: 380 },
                        height: { xs: "min(560px, 70vh)", sm: 520 },
                        maxWidth: 420,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: 4,
                        zIndex: (theme) => theme.zIndex.modal,
                        border: 1,
                        borderColor: "divider",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 2,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                        }}
                    >
                        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "inherit" }}>
                            <AutoAwesomeRoundedIcon />
                        </Avatar>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography fontWeight={700}>TaskFlow AI</Typography>
                            <Typography variant="caption">
                                Your personal task assistant
                            </Typography>
                        </Box>

                        <IconButton
                            aria-label="Close AI Assistant"
                            onClick={() => setOpen(false)}
                            sx={{ color: "inherit" }}
                        >
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>

                    <Box
                        aria-live="polite"
                        sx={{
                            flexGrow: 1,
                            overflowY: "auto",
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                            bgcolor: "background.default",
                        }}
                    >
                        {messages.map((message, index) => (
                            <Box
                                key={`${index}-${message.role}`}
                                sx={{
                                    alignSelf:
                                        message.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "88%",
                                    p: 1.5,
                                    borderRadius: 3,
                                    bgcolor:
                                        message.role === "user"
                                            ? "primary.main"
                                            : message.isError
                                            ? "error.light"
                                            : "background.paper",
                                    color:
                                        message.role === "user"
                                            ? "primary.contrastText"
                                            : message.isError
                                            ? "error.contrastText"
                                            : "text.primary",
                                    border: message.role === "assistant" && !message.isError ? 1 : 0,
                                    borderColor: "divider",
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                <Typography variant="body2">{message.text}</Typography>
                                {message.isError && lastFailedMessage && index === messages.length - 1 && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="inherit"
                                        startIcon={<ReplayRoundedIcon fontSize="small" />}
                                        onClick={() => sendMessage(undefined, lastFailedMessage)}
                                        disabled={loading}
                                        sx={{
                                            mt: 1,
                                            borderRadius: 2,
                                            textTransform: "none",
                                            fontWeight: 600,
                                            fontSize: 12,
                                            py: 0.25,
                                            bgcolor: "rgba(255,255,255,0.15)",
                                            "&:hover": {
                                                bgcolor: "rgba(255,255,255,0.25)",
                                            },
                                        }}
                                    >
                                        Retry
                                    </Button>
                                )}
                            </Box>
                        ))}

                        {loading && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="caption">Thinking...</Typography>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    <Box
                        component="form"
                        onSubmit={sendMessage}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            p: 1.5,
                            borderTop: 1,
                            borderColor: "divider",
                            bgcolor: "background.paper",
                        }}
                    >
                        <TextField
                            id="ai-assistant-message-input"
                            name="aiMessage"
                            fullWidth
                            size="small"
                            label="Ask TaskFlow AI"
                            placeholder="Ask TaskFlow AI..."
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            disabled={loading}
                            inputProps={{
                                id: "ai-assistant-message-input",
                                name: "aiMessage",
                                "aria-label": "Ask TaskFlow AI",
                            }}
                            InputLabelProps={{
                                htmlFor: "ai-assistant-message-input",
                            }}
                        />

                        <IconButton
                            type="submit"
                            color="primary"
                            disabled={!input.trim() || loading}
                            aria-label="Send message"
                        >
                            {loading ? <CircularProgress size={20} /> : <SendRoundedIcon />}
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </>
    );
}