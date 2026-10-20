import { useState } from "react";
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
import type { Task } from "../types";
import { formatDue, isOverdue, todayISO, PRIORITY_META, STATUS_META } from "../utils";
import { useTaskStore } from "../store";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export default function TodayWidget({ tasks, onEdit }: Props) {
  const [expanded, setExpanded] = useState(true);
  const moveTask = useTaskStore((s) => s.moveTask);

  const today = todayISO();
  const overdueTasks = tasks.filter(isOverdue);
  const dueTodayTasks = tasks.filter((t) => t.dueDate === today && t.status !== "done");

  const totalCount = overdueTasks.length + dueTodayTasks.length;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 3,
        borderRadius: 3,
        borderColor: (t) =>
          overdueTasks.length > 0
            ? alpha(t.palette.error.main, 0.4)
            : totalCount > 0
            ? alpha(t.palette.primary.main, 0.4)
            : "divider",
        bgcolor: (t) =>
          overdueTasks.length > 0
            ? alpha(t.palette.error.main, t.palette.mode === "light" ? 0.03 : 0.06)
            : totalCount > 0
            ? alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.03 : 0.06)
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
              bgcolor: (t) =>
                overdueTasks.length > 0
                  ? alpha(t.palette.error.main, 0.15)
                  : alpha(t.palette.primary.main, 0.15),
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
              Today's Agenda
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalCount === 0
                ? "No tasks due today or overdue"
                : `${totalCount} urgent task${totalCount > 1 ? "s" : ""} require attention`}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {overdueTasks.length > 0 && (
            <Chip
              size="small"
              color="error"
              label={`${overdueTasks.length} Overdue`}
              sx={{ fontWeight: 700 }}
            />
          )}
          {dueTodayTasks.length > 0 && (
            <Chip
              size="small"
              color="primary"
              label={`${dueTodayTasks.length} Due Today`}
              sx={{ fontWeight: 700 }}
            />
          )}
          {totalCount === 0 && (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label="All caught up"
              sx={{ fontWeight: 600 }}
            />
          )}

          <IconButton size="small" aria-label="Toggle Today widget">
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Expanded list */}
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
          {totalCount === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              🎉 All caught up! You have no tasks due today or overdue.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {/* Overdue Items */}
              {overdueTasks.map((t) => (
                <Box
                  key={t.id}
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
                  <Tooltip title="Mark as Done">
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => moveTask(t.id, "done")}
                    >
                      <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Typography
                    variant="body2"
                    fontWeight={600}
                    onClick={() => onEdit(t)}
                    sx={{ flex: 1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  >
                    {t.title}
                  </Typography>

                  <Chip
                    size="small"
                    color="error"
                    label={`Overdue · ${formatDue(t.dueDate!)}`}
                    sx={{ fontSize: 11, height: 22, fontWeight: 700 }}
                  />

                  <Chip
                    size="small"
                    label={PRIORITY_META[t.priority].label}
                    sx={{
                      fontSize: 11,
                      height: 22,
                      color: PRIORITY_META[t.priority].color,
                      bgcolor: alpha(PRIORITY_META[t.priority].color, 0.12),
                      fontWeight: 700,
                    }}
                  />

                  <Chip
                    size="small"
                    label={STATUS_META[t.status].label}
                    variant="outlined"
                    sx={{ fontSize: 11, height: 22 }}
                  />
                </Box>
              ))}

              {/* Due Today Items */}
              {dueTodayTasks.map((t) => (
                <Box
                  key={t.id}
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
                  <Tooltip title="Mark as Done">
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => moveTask(t.id, "done")}
                    >
                      <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Typography
                    variant="body2"
                    fontWeight={600}
                    onClick={() => onEdit(t)}
                    sx={{ flex: 1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  >
                    {t.title}
                  </Typography>

                  <Chip
                    size="small"
                    color="primary"
                    variant="filled"
                    label="Today"
                    sx={{ fontSize: 11, height: 22, fontWeight: 700 }}
                  />

                  <Chip
                    size="small"
                    label={PRIORITY_META[t.priority].label}
                    sx={{
                      fontSize: 11,
                      height: 22,
                      color: PRIORITY_META[t.priority].color,
                      bgcolor: alpha(PRIORITY_META[t.priority].color, 0.12),
                      fontWeight: 700,
                    }}
                  />

                  <Chip
                    size="small"
                    label={STATUS_META[t.status].label}
                    variant="outlined"
                    sx={{ fontSize: 11, height: 22 }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}
