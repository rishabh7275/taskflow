import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  alpha,
  useTheme,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { useTranslation } from "react-i18next";
import type { Task } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  boardName?: string;
}

interface PlanSection {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
}

export default function SmartPlannerDialog({ open, onClose, tasks, boardName }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [planText, setPlanText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const pendingTasks = tasks.filter((t) => t.status !== "done");

  const generatePlan = async () => {
    // If no pending tasks exist, we can provide immediate feedback
    if (tasks.length === 0) {
      setPlanText(
        "### 📋 No Tasks Found\n\nYour board does not have any tasks yet! To generate an AI Smart Plan:\n1. Click **New Task** or load demo data from **Data Tools**.\n2. Add titles, priorities, and due dates.\n3. Re-run **AI Smart Planner** to receive your custom daily schedule and priorities."
      );
      setLoading(false);
      setError(null);
      return;
    }

    if (pendingTasks.length === 0) {
      setPlanText(
        "### 🎉 All Caught Up!\n\nAll tasks on this board are already marked as **Done**! You have no pending items for today.\n\n- **Great job finishing your work!**\n- If you have new goals for today, add them using **New Task** and re-run the planner whenever you're ready."
      );
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel prior request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeout = setTimeout(() => {
      controller.abort();
    }, 25000);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "planner",
          message:
            "Please analyze my current tasks and generate my daily smart plan following the 4 required sections: 1. Today's Priorities, 2. Recommended Task Order, 3. Deadline Warnings, and 4. Suggested Next Steps.",
          tasks,
        }),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      const raw = await response.text();
      let data: { reply?: string; error?: string } = {};

      if (raw && contentType.includes("application/json")) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { error: "Received malformed JSON from AI service." };
        }
      } else if (raw) {
        data = { error: raw };
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `AI request failed with status ${response.status} (${response.statusText || "Server Error"}).`
        );
      }

      if (!data.reply) {
        throw new Error("The AI assistant returned an empty response. Please try again.");
      }

      setPlanText(data.reply);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const errorMsg = isAbort
        ? "AI Smart Planner request timed out after 25 seconds. Please try again."
        : err instanceof Error
        ? err.message
        : "Failed to generate plan. Please try again.";
      setError(errorMsg);
    } finally {
      clearTimeout(timeout);
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Auto generate on open if we have no active plan
      if (!planText && !loading) {
        void generatePlan();
      }
    } else {
      abortControllerRef.current?.abort();
    }
  }, [open]);

  const handleCopy = async () => {
    if (!planText) return;
    try {
      await navigator.clipboard.writeText(planText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Parse markdown into 4 clean visual sections if present
  const parseSections = (text: string): PlanSection[] | null => {
    // Check if the 4 sections exist in markdown
    const regex = /###\s*(?:[1-4]\.\s*)?([^\n]+)/gi;
    const matches: { title: string; index: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ title: match[1].trim(), index: match.index });
    }

    if (matches.length < 2) return null;

    const sections: PlanSection[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const rawChunk = text.slice(start, end).replace(/^###[^\n]+\n+/, "").trim();
      const rawTitle = matches[i].title;

      let icon = <LightbulbRoundedIcon fontSize="small" />;
      let color = theme.palette.primary.main;

      const lower = rawTitle.toLowerCase();
      if (lower.includes("priorit")) {
        icon = <StarRoundedIcon fontSize="small" />;
        color = "#D97706"; // Amber
      } else if (lower.includes("order") || lower.includes("sequence")) {
        icon = <FormatListNumberedRoundedIcon fontSize="small" />;
        color = theme.palette.primary.main; // Primary
      } else if (lower.includes("deadline") || lower.includes("warning") || lower.includes("overdue")) {
        icon = <WarningAmberRoundedIcon fontSize="small" />;
        color = "#E11D48"; // Rose / Warning
      } else if (lower.includes("next step") || lower.includes("action") || lower.includes("schedule")) {
        icon = <LightbulbRoundedIcon fontSize="small" />;
        color = "#059669"; // Emerald / Teal
      }

      sections.push({
        id: `section-${i}`,
        title: rawTitle,
        content: rawChunk,
        icon,
        color,
      });
    }

    return sections;
  };

  const parsedSections = planText ? parseSections(planText) : null;

  // Render markdown text formatting (bolding, bullet lines, sub-items)
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <Box key={idx} sx={{ height: 4 }} />;
          }

          // Bullet item
          const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed);
          const cleanLine = trimmed.replace(/^[\*\-]\s+/, "").replace(/^\d+\.\s+/, "");

          // Format bold text
          const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

          return (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                pl: isBullet ? 1 : 0,
              }}
            >
              {isBullet && (
                <Box
                  component="span"
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "text.secondary",
                    mt: 1,
                    flexShrink: 0,
                  }}
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.6,
                  color: trimmed.startsWith("*(") ? "text.secondary" : "text.primary",
                  fontStyle: trimmed.startsWith("*(") ? "italic" : "normal",
                }}
              >
                {parts.map((part, pIdx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <Box component="strong" key={pIdx} sx={{ fontWeight: 700 }}>
                        {part.slice(2, -2)}
                      </Box>
                    );
                  }
                  return part;
                })}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.04 : 0.1),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "grid",
              placeItems: "center",
              boxShadow: (th) => `0 4px 12px ${alpha(th.palette.primary.main, 0.4)}`,
            }}
          >
            <AutoAwesomeRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {t("board.aiSmartPlanner", { defaultValue: "AI Smart Planner" })}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
              {boardName && (
                <Chip
                  size="small"
                  icon={<ViewKanbanOutlinedIcon fontSize="small" />}
                  label={boardName}
                  sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {pendingTasks.length} {t("today.pending", { defaultValue: "pending tasks" })}
              </Typography>
            </Stack>
          </Box>
        </Box>

        <IconButton onClick={onClose} aria-label="Close Smart Planner" size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "background.default" }}>
        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              py: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textAlign: "center",
            }}
          >
            <CircularProgress size={44} thickness={4} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Analyzing your tasks and deadlines...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                TaskFlow AI is structuring your priorities, recommended sequence, and schedule.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Error State */}
        {!loading && error && (
          <Box sx={{ py: 3 }}>
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={generatePlan}
                  sx={{ fontWeight: 700 }}
                >
                  Retry
                </Button>
              }
              sx={{ borderRadius: 2 }}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Empty state when 0 tasks exist on board */}
        {!loading && !error && tasks.length === 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No Tasks on this Board
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: "auto", mb: 2.5 }}>
              Add some tasks with priorities and deadlines, or load demo tasks to let TaskFlow AI structure your day.
            </Typography>
          </Paper>
        )}

        {/* Plan Display */}
        {!loading && !error && planText && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {parsedSections ? (
              parsedSections.map((sec) => (
                <Paper
                  key={sec.id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    borderColor: alpha(sec.color, 0.35),
                    bgcolor: "background.paper",
                    position: "relative",
                    overflow: "hidden",
                    borderLeft: `4px solid ${sec.color}`,
                    transition: "box-shadow 0.2s ease",
                    "&:hover": {
                      boxShadow: `0 4px 16px ${alpha(sec.color, 0.12)}`,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(sec.color, 0.12),
                        color: sec.color,
                      }}
                    >
                      {sec.icon}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: "text.primary" }}>
                      {sec.title}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 1.5, borderColor: alpha(sec.color, 0.15) }} />

                  {renderFormattedContent(sec.content)}
                </Paper>
              ))
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                {renderFormattedContent(planText)}
              </Paper>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center", display: "block", mt: 1, fontStyle: "italic" }}
            >
              TaskFlow AI is an advisory planning assistant. Your tasks remain untouched unless you choose to edit them.
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1}>
          {planText && !loading && (
            <Tooltip title="Copy plan markdown to clipboard">
              <Button
                size="small"
                variant="outlined"
                startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                onClick={handleCopy}
                color={copied ? "success" : "inherit"}
                sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none" }}
              >
                {copied ? "Copied!" : "Copy Plan"}
              </Button>
            </Tooltip>
          )}

          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={generatePlan}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none" }}
          >
            Refresh Plan
          </Button>
        </Stack>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
        >
          {t("common.done", { defaultValue: "Close" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
