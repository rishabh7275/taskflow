import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Card,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailableOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RepeatIcon from "@mui/icons-material/Repeat";
import type { Task } from "../types";
import { formatDue, isOverdue, todayISO, PRIORITY_META } from "../utils";
import { useTaskStore } from "../store";
import { isRecurring, formatRecurrenceLabel } from "../lib/recurrence";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export default function TodayWidget({ tasks, onEdit }: Props) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const moveTask = useTaskStore((s) => s.moveTask);

  const today = todayISO();
  const overdueTasks = tasks.filter(isOverdue);
  const dueTodayTasks = tasks.filter((t) => t.dueDate === today && t.status !== "done");

  const totalCount = overdueTasks.length + dueTodayTasks.length;
  const locale = i18n.language === "hi" ? "hi-IN" : "en-IN";

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 3,
        borderRadius: 3,
        borderColor: (theme) =>
          overdueTasks.length > 0
            ? alpha(theme.palette.error.main, 0.4)
            : totalCount > 0
            ? alpha(theme.palette.primary.main, 0.4)
            : "divider",
        bgcolor: (theme) =>
          overdueTasks.length > 0
            ? alpha(theme.palette.error.main, theme.palette.mode === "light" ? 0.03 : 0.06)
            : totalCount > 0
            ? alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.03 : 0.06)
            : "background.paper",
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: (theme) =>
                overdueTasks.length > 0
                  ? alpha(theme.palette.error.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.15),
              color: overdueTasks.length > 0 ? "error.main" : "primary.main",
              display: "grid",
              placeItems: "center",
            }}
          >
            {overdueTasks.length > 0 ? (
              <WarningAmberIcon fontSize="small" />
            ) : (
              <EventAvailableIcon fontSize="small" />
            )}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.1 }}>
              {t("today.widgetTitle")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalCount === 0
                ? t("today.emptySubtitle")
                : t("today.urgentAttention", { count: totalCount })}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {overdueTasks.length > 0 && (
            <Chip
              size="small"
              color="error"
              label={t("today.overdueCount", { count: overdueTasks.length })}
              sx={{ fontWeight: 700 }}
            />
          )}
          {dueTodayTasks.length > 0 && (
            <Chip
              size="small"
              color="primary"
              label={t("today.dueTodayCount", { count: dueTodayTasks.length })}
              sx={{ fontWeight: 700 }}
            />
          )}
          {totalCount === 0 && (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={t("today.allCaughtUp")}
              sx={{ fontWeight: 600 }}
            />
          )}

          <IconButton size="small" aria-label={t("today.toggleWidget")}>
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Expanded list */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
          {totalCount === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {t("today.empty")}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {/* Overdue Items */}
              {overdueTasks.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: 1,
                    borderColor: (theme) => alpha(theme.palette.error.main, 0.25),
                    bgcolor: "background.paper",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Tooltip title={t("task.markAsDone")}>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => moveTask(item.id, "done")}
                    >
                      <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Typography
                    variant="body2"
                    fontWeight={600}
                    onClick={() => onEdit(item)}
                    sx={{ flex: 1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  >
                    {item.title}
                  </Typography>

                  <Chip
                    size="small"
                    color="error"
                    label={`${t("board.overdue")} · ${formatDue(item.dueDate!, locale)}`}
                    sx={{ fontSize: 11, height: 22, fontWeight: 700 }}
                  />

                  <Chip
                    size="small"
                    label={t(`priority.${item.priority}`)}
                    sx={{
                      fontSize: 11,
                      height: 22,
                      color: PRIORITY_META[item.priority].color,
                      bgcolor: alpha(PRIORITY_META[item.priority].color, 0.12),
                      fontWeight: 700,
                    }}
                  />

                  <Chip
                    size="small"
                    label={t(`status.${item.status}`)}
                    variant="outlined"
                    sx={{ fontSize: 11, height: 22 }}
                  />

                  {isRecurring(item) && (
                    <Tooltip title={formatRecurrenceLabel(item.recurrence, t)} arrow>
                      <Chip
                        size="small"
                        icon={<RepeatIcon sx={{ fontSize: "12px !important" }} />}
                        label={
                          item.recurrence?.frequency === "daily"
                            ? t("recurrence.daily", "Daily")
                            : item.recurrence?.frequency === "weekly"
                            ? t("recurrence.weekly", "Weekly")
                            : t("recurrence.monthly", "Monthly")
                        }
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: 10, height: 22, fontWeight: 600 }}
                      />
                    </Tooltip>
                  )}
                </Box>
              ))}

              {/* Due Today Items */}
              {dueTodayTasks.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Tooltip title={t("task.markAsDone")}>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => moveTask(item.id, "done")}
                    >
                      <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Typography
                    variant="body2"
                    fontWeight={600}
                    onClick={() => onEdit(item)}
                    sx={{ flex: 1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  >
                    {item.title}
                  </Typography>

                  <Chip
                    size="small"
                    color="primary"
                    variant="filled"
                    label={t("today.todayChip")}
                    sx={{ fontSize: 11, height: 22, fontWeight: 700 }}
                  />

                  <Chip
                    size="small"
                    label={t(`priority.${item.priority}`)}
                    sx={{
                      fontSize: 11,
                      height: 22,
                      color: PRIORITY_META[item.priority].color,
                      bgcolor: alpha(PRIORITY_META[item.priority].color, 0.12),
                      fontWeight: 700,
                    }}
                  />

                  <Chip
                    size="small"
                    label={t(`status.${item.status}`)}
                    variant="outlined"
                    sx={{ fontSize: 11, height: 22 }}
                  />

                  {isRecurring(item) && (
                    <Tooltip title={formatRecurrenceLabel(item.recurrence, t)} arrow>
                      <Chip
                        size="small"
                        icon={<RepeatIcon sx={{ fontSize: "12px !important" }} />}
                        label={
                          item.recurrence?.frequency === "daily"
                            ? t("recurrence.daily", "Daily")
                            : item.recurrence?.frequency === "weekly"
                            ? t("recurrence.weekly", "Weekly")
                            : t("recurrence.monthly", "Monthly")
                        }
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: 10, height: 22, fontWeight: 600 }}
                      />
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}
