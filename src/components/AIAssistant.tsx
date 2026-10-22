import { useState, type FormEvent } from "react";
import {
    Box,
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

type ChatMessage = {
    role: "user" | "assistant";
    text: string;
};

export default function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            text: "Hi! I am your TaskFlow AI Assistant. I can help you plan your day, prioritize tasks, and break big tasks into smaller steps. What would you like help with?",
        },
    ]);

    const sendMessage = async (event?: FormEvent) => {
        event?.preventDefault();

        const message = input.trim();
        if (!message || loading) return;

        setMessages((previous) => [
            ...previous,
            { role: "user", text: message },
        ]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "AI request failed.");
            }

            setMessages((previous) => [
                ...previous,
                { role: "assistant", text: data.reply },
            ]);
        } catch (error) {
            console.error("AI Assistant request failed:", error);

            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    text: "I could not connect to the AI service. Please check the backend configuration and deployment.",
                },
            ]);
        } finally {
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
                                            : "background.paper",
                                    color:
                                        message.role === "user"
                                            ? "primary.contrastText"
                                            : "text.primary",
                                    border: message.role === "assistant" ? 1 : 0,
                                    borderColor: "divider",
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                <Typography variant="body2">{message.text}</Typography>
                            </Box>
                        ))}

                        {loading && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="caption">Thinking...</Typography>
                            </Box>
                        )}
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
                            fullWidth
                            size="small"
                            placeholder="Ask TaskFlow AI..."
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            disabled={loading}
                        />

                        <IconButton
                            type="submit"
                            color="primary"
                            disabled={!input.trim() || loading}
                            aria-label="Send message"
                        >
                            <SendRoundedIcon />
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </>
    );
}