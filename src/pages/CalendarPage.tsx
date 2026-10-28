import { useMemo, useState, type MouseEvent } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import FlagIcon from "@mui/icons-material/Flag";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ViewKanbanIcon from "@mui/icons-material/ViewKanbanOutlined";
import RepeatIcon from "@mui/icons-material/Repeat";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store";
import type { Status, Task } from "../types";
import { PRIORITY_META, STATUS_META, todayISO } from "../utils";
import { isRecurring, formatRecurrenceLabel } from "../lib/recurrence";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n: number) => String(n).padStart(2, "0");

const formatDateKey = (year: number, monthIndex: number, day: number) =>
  `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDialog, setSelectedDayDialog] = useState<{
    dateKey: string;
    displayDate: string;
    tasks: Task[];
  } | null>(null);

  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const boards = useTaskStore((s) => s.boards);
  const allTasks = useTaskStore((s) => s.tasks);
  const query = useTaskStore((s) => s.query);
  const openNewTask = useTaskStore((s) => s.openNewTask);
  const openEditTask = useTaskStore((s) => s.openEditTask);

  const activeBoard = useMemo(
    () => boards.find((b) => b.id === activeBoardId) || boards[0],
    [boards, activeBoardId]
  );

  // Filter tasks belonging strictly to active board
  const boardTasks = useMemo(() => {
    return allTasks.filter((task) => task.boardId === activeBoardId);
  }, [allTasks, activeBoardId]);

  // Tasks without a due date on active board
  const unscheduledTasks = useMemo(() => {
    return boardTasks.filter((task) => !task.dueDate);
  }, [boardTasks]);

  // Map scheduled tasks by YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    const q = query.trim().toLowerCase();

    for (const task of boardTasks) {
      if (!task.dueDate) continue;

      // Filter by global search query if present
      if (q) {
        const matchesQuery =
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          (task.notes && task.notes.toLowerCase().includes(q)) ||
          task.labels.some((l) => l.name.toLowerCase().includes(q));

        if (!matchesQuery) continue;
      }

      const existing = map.get(task.dueDate);
      if (existing) {
        existing.push(task);
      } else {
        map.set(task.dueDate, [task]);
      }
    }

    return map;
  }, [boardTasks, query]);

  // Year & Month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Month-level statistics
  const currentMonthStats = useMemo(() => {
    let totalScheduled = 0;
    let completedCount = 0;
    let highPriorityCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const key = formatDateKey(year, month, day);
      const dayTasks = tasksByDate.get(key) || [];
      totalScheduled += dayTasks.length;
      for (const t of dayTasks) {
        if (t.status === "done") completedCount++;
        if (t.priority === "high") highPriorityCount++;
      }
    }

    return { totalScheduled, completedCount, highPriorityCount };
  }, [year, month, daysInMonth, tasksByDate]);

  // Locale-aware month formatting
  const monthHeading = useMemo(() => {
    const locale = i18n.language === "hi" ? "hi-IN" : "en-US";
    return currentDate.toLocaleString(locale, {
      month: "long",
      year: "numeric",
    });
  }, [currentDate, i18n.language]);

  const todayDateString = todayISO();

  // Build calendar grid days:
  // 1. Previous month trailing days
  const prevMonthCells = useMemo(() => {
    const count = firstDayWeekday;
    const cells: { day: number; dateKey: string; isCurrentMonth: boolean }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      cells.push({
        day: d,
        dateKey: formatDateKey(prevDate.getFullYear(), prevDate.getMonth(), d),
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [firstDayWeekday, daysInPrevMonth, year, month]);

  // 2. Current month days
  const currentMonthCells = useMemo(() => {
    const cells: { day: number; dateKey: string; isCurrentMonth: boolean }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        dateKey: formatDateKey(year, month, day),
        isCurrentMonth: true,
      });
    }
    return cells;
  }, [daysInMonth, year, month]);

  // 3. Next month leading days to complete full weeks
  const nextMonthCells = useMemo(() => {
    const totalFilled = prevMonthCells.length + currentMonthCells.length;
    const remainder = totalFilled % 7;
    const needed = remainder === 0 ? 0 : 7 - remainder;
    const cells: { day: number; dateKey: string; isCurrentMonth: boolean }[] = [];
    for (let day = 1; day <= needed; day++) {
      const nextDate = new Date(year, month + 1, day);
      cells.push({
        day,
        dateKey: formatDateKey(nextDate.getFullYear(), nextDate.getMonth(), day),
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [prevMonthCells.length, currentMonthCells.length, year, month]);

  const allCalendarCells = useMemo(
    () => [...prevMonthCells, ...currentMonthCells, ...nextMonthCells],
    [prevMonthCells, currentMonthCells, nextMonthCells]
  );

  // Status icon helper
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "done":
        return <CheckCircleOutlineIcon sx={{ fontSize: 13 }} />;
      case "doing":
        return <PlayCircleOutlineIcon sx={{ fontSize: 13 }} />;
      case "todo":
      default:
        return <RadioButtonUncheckedIcon sx={{ fontSize: 13 }} />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1600, mx: "auto" }}>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CalendarMonthIcon sx={{ color: "primary.main", fontSize: 32 }} />
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
              {t("nav.calendar", { defaultValue: "Calendar" })}
            </Typography>
          </Box>
          {activeBoard && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Chip
                size="small"
                icon={<ViewKanbanIcon fontSize="small" />}
                label={activeBoard.name}
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: 12 }}
              />
              <Typography variant="caption" color="text.secondary">
                {t("boards.title", { defaultValue: "Board" })} • {boardTasks.length} {t("common.tasks", { defaultValue: "tasks" })}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Controls & New Task button */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => openNewTask("todo", todayDateString)}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            {t("task.newTask", { defaultValue: "New Task" })}
          </Button>
        </Stack>
      </Box>

      {/* Main Calendar Paper Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {/* Calendar Month Navigation Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
            pb: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {/* Month / Year Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" fontWeight={700} sx={{ textTransform: "capitalize" }}>
              {monthHeading}
            </Typography>
          </Box>

          {/* Month Navigation Buttons */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={handleGoToToday}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                borderColor: "divider",
              }}
            >
              {t("calendar.today", { defaultValue: "Today" })}
            </Button>

            <Tooltip title={t("calendar.previousMonth", { defaultValue: "Previous month" })}>
              <IconButton
                size="small"
                onClick={handlePreviousMonth}
                aria-label={t("calendar.previousMonth", { defaultValue: "Previous month" })}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              onClick={handlePreviousMonth}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                borderColor: "divider",
              }}
            >
              {t("calendar.prev", { defaultValue: "Prev" })}
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={handleNextMonth}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                borderColor: "divider",
              }}
            >
              {t("calendar.next", { defaultValue: "Next" })}
            </Button>

            <Tooltip title={t("calendar.nextMonth", { defaultValue: "Next month" })}>
              <IconButton
                size="small"
                onClick={handleNextMonth}
                aria-label={t("calendar.nextMonth", { defaultValue: "Next month" })}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Month Summary Stats Chips */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              label={`${currentMonthStats.totalScheduled} ${t("calendar.scheduled", { defaultValue: "scheduled" })}`}
              sx={{
                bgcolor: (th) => alpha(th.palette.primary.main, 0.1),
                color: "primary.main",
                fontWeight: 600,
                fontSize: 12,
              }}
            />
            {currentMonthStats.completedCount > 0 && (
              <Chip
                size="small"
                icon={<CheckCircleOutlineIcon style={{ color: "#2E9E6B", fontSize: 14 }} />}
                label={`${currentMonthStats.completedCount} ${t("status.done", { defaultValue: "done" })}`}
                sx={{
                  bgcolor: alpha("#2E9E6B", 0.12),
                  color: "#2E9E6B",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              />
            )}
            {currentMonthStats.highPriorityCount > 0 && (
              <Chip
                size="small"
                icon={<FlagIcon style={{ color: "#D6453D", fontSize: 14 }} />}
                label={`${currentMonthStats.highPriorityCount} ${t("priority.high", { defaultValue: "high" })}`}
                sx={{
                  bgcolor: alpha("#D6453D", 0.12),
                  color: "#D6453D",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Calendar Weekday Names Header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: { xs: 0.5, sm: 1 },
            mb: 1,
          }}
        >
          {WEEKDAYS.map((dayName, idx) => (
            <Box
              key={dayName}
              sx={{
                py: 1,
                textAlign: "center",
                borderRadius: 1.5,
                bgcolor: (th) =>
                  idx === 0 || idx === 6
                    ? alpha(th.palette.action.hover, 0.4)
                    : "transparent",
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color={idx === 0 || idx === 6 ? "text.secondary" : "text.primary"}
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: { xs: "none", sm: "block" },
                }}
              >
                {dayName}
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color={idx === 0 || idx === 6 ? "text.secondary" : "text.primary"}
                sx={{
                  display: { xs: "block", sm: "none" },
                }}
              >
                {WEEKDAYS_SHORT[idx]}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Day Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          {allCalendarCells.map((cell) => {
            const { day, dateKey, isCurrentMonth } = cell;
            const isToday = dateKey === todayDateString;
            const dayTasks = tasksByDate.get(dateKey) || [];

            // Display up to 3 tasks on desktop, 2 on mobile
            const maxVisible = 3;
            const visibleTasks = dayTasks.slice(0, maxVisible);
            const hiddenCount = dayTasks.length - maxVisible;

            const handleDateClick = () => {
              openNewTask("todo", dateKey);
            };

            const handleOpenDayDialog = (e: MouseEvent) => {
              e.stopPropagation();
              const formattedDate = new Date(`${dateKey}T00:00:00`).toLocaleDateString(
                i18n.language === "hi" ? "hi-IN" : "en-US",
                { weekday: "short", month: "short", day: "numeric", year: "numeric" }
              );
              setSelectedDayDialog({
                dateKey,
                displayDate: formattedDate,
                tasks: dayTasks,
              });
            };

            return (
              <Paper
                key={dateKey}
                variant="outlined"
                onClick={handleDateClick}
                sx={{
                  minHeight: { xs: 75, sm: 105, md: 125 },
                  p: { xs: 0.75, sm: 1 },
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.15s ease",
                  borderColor: isToday
                    ? "primary.main"
                    : isCurrentMonth
                    ? "divider"
                    : alpha(theme.palette.divider, 0.4),
                  borderWidth: isToday ? 2 : 1,
                  bgcolor: isToday
                    ? alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.05 : 0.12)
                    : isCurrentMonth
                    ? "background.paper"
                    : alpha(theme.palette.action.disabledBackground, 0.15),
                  opacity: isCurrentMonth ? 1 : 0.55,
                  "&:hover": {
                    bgcolor: (th) =>
                      isToday
                        ? alpha(th.palette.primary.main, th.palette.mode === "light" ? 0.09 : 0.18)
                        : alpha(th.palette.action.hover, 0.8),
                    borderColor: isToday ? "primary.main" : "text.secondary",
                    "& .add-task-btn": {
                      opacity: 1,
                    },
                  },
                }}
              >
                {/* Cell Header: Date Number + Quick Add Button */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: isToday ? 24 : "auto",
                      height: isToday ? 24 : "auto",
                      borderRadius: isToday ? "50%" : 0,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: isToday ? "primary.main" : "transparent",
                      color: isToday ? "primary.contrastText" : isCurrentMonth ? "text.primary" : "text.secondary",
                      px: isToday ? 0 : 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isToday ? 800 : isCurrentMonth ? 700 : 500,
                        fontSize: { xs: 11, sm: 12.5 },
                        lineHeight: 1,
                      }}
                    >
                      {day}
                    </Typography>
                  </Box>

                  {/* Add Task Hover Button */}
                  <Tooltip title={t("task.addTaskForDate", { defaultValue: "Add task for this date" })}>
                    <IconButton
                      className="add-task-btn"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewTask("todo", dateKey);
                      }}
                      aria-label={`Add task on ${dateKey}`}
                      sx={{
                        opacity: { xs: 0.7, sm: 0 },
                        p: 0.25,
                        width: 20,
                        height: 20,
                        transition: "opacity 0.15s ease",
                        "&:hover": {
                          color: "primary.main",
                          bgcolor: (th) => alpha(th.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <AddIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Day Tasks List */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    flexGrow: 1,
                    overflow: "hidden",
                  }}
                >
                  {visibleTasks.map((task) => {
                    const isDone = task.status === "done";
                    const priorityColor = PRIORITY_META[task.priority]?.color ?? "#6B7A99";
                    const statusColor = STATUS_META[task.status]?.color ?? "#6B7A99";

                    const handleTaskClick = (e: MouseEvent) => {
                      e.stopPropagation();
                      openEditTask(task);
                    };

                    return (
                      <Tooltip
                        key={task.id}
                        title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight={700}>
                              {task.title}
                            </Typography>
                            {task.description && (
                              <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.25 }}>
                                {task.description}
                              </Typography>
                            )}
                            <Divider sx={{ my: 0.5, borderColor: "rgba(255,255,255,0.15)" }} />
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={PRIORITY_META[task.priority]?.label ?? task.priority}
                                sx={{
                                  height: 18,
                                  fontSize: 10,
                                  bgcolor: alpha(priorityColor, 0.25),
                                  color: priorityColor,
                                  fontWeight: 700,
                                }}
                              />
                              <Chip
                                size="small"
                                label={STATUS_META[task.status]?.label ?? task.status}
                                sx={{
                                  height: 18,
                                  fontSize: 10,
                                  bgcolor: alpha(statusColor, 0.25),
                                  color: statusColor,
                                  fontWeight: 700,
                                }}
                              />
                              {task.subtasks.length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                                </Typography>
                              )}
                              {isRecurring(task) && (
                                <Chip
                                  size="small"
                                  icon={<RepeatIcon sx={{ fontSize: "12px !important" }} />}
                                  label={formatRecurrenceLabel(task.recurrence, t)}
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    bgcolor: alpha(theme.palette.primary.main, 0.25),
                                    color: "primary.main",
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        }
                      >
                        <Box
                          onClick={handleTaskClick}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              openEditTask(task);
                            }
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 0.75,
                            py: 0.35,
                            borderRadius: 1,
                            fontSize: { xs: 10, sm: 11 },
                            fontWeight: 600,
                            borderLeft: `3px solid ${priorityColor}`,
                            bgcolor: isDone
                              ? (th) => alpha(th.palette.action.disabledBackground, 0.4)
                              : (th) =>
                                  alpha(
                                    priorityColor,
                                    th.palette.mode === "light" ? 0.08 : 0.16
                                  ),
                            color: isDone ? "text.secondary" : "text.primary",
                            textDecoration: isDone ? "line-through" : "none",
                            cursor: "pointer",
                            transition: "transform 0.1s ease, background-color 0.15s ease",
                            "&:hover": {
                              bgcolor: (th) =>
                                alpha(
                                  priorityColor,
                                  th.palette.mode === "light" ? 0.18 : 0.28
                                ),
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              color: isDone ? "#2E9E6B" : statusColor,
                              flexShrink: 0,
                            }}
                          >
                            {getStatusIcon(task.status)}
                          </Box>
                          <Typography
                            variant="inherit"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flexGrow: 1,
                              lineHeight: 1.2,
                            }}
                          >
                            {task.title}
                          </Typography>
                          {isRecurring(task) && (
                            <Tooltip title={formatRecurrenceLabel(task.recurrence, t)}>
                              <RepeatIcon
                                sx={{
                                  fontSize: 13,
                                  color: "primary.main",
                                  flexShrink: 0,
                                  opacity: 0.9,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })}

                  {/* "+N more" badge if tasks exceed visible limit */}
                  {hiddenCount > 0 && (
                    <Box
                      onClick={handleOpenDayDialog}
                      sx={{
                        px: 0.5,
                        py: 0.2,
                        borderRadius: 1,
                        fontSize: { xs: 9.5, sm: 10.5 },
                        fontWeight: 700,
                        color: "primary.main",
                        textAlign: "center",
                        bgcolor: (th) => alpha(th.palette.primary.main, 0.08),
                        "&:hover": {
                          bgcolor: (th) => alpha(th.palette.primary.main, 0.18),
                        },
                      }}
                    >
                      +{hiddenCount} {t("calendar.more", { defaultValue: "more" })}
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Paper>

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventBusyIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {t("calendar.unscheduledTitle", { defaultValue: "Tasks Without Due Date" })} ({unscheduledTasks.length})
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t("calendar.unscheduledHint", { defaultValue: "Click a task to assign a due date" })}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {unscheduledTasks.map((task) => {
              const priorityColor = PRIORITY_META[task.priority]?.color ?? "#6B7A99";
              return (
                <Chip
                  key={task.id}
                  label={task.title}
                  size="small"
                  onClick={() => openEditTask(task)}
                  sx={{
                    borderLeft: `3px solid ${priorityColor}`,
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: alpha(priorityColor, 0.15),
                    },
                  }}
                />
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Day Overview Dialog (when "+N more" or day inspection is triggered) */}
      <Dialog
        open={Boolean(selectedDayDialog)}
        onClose={() => setSelectedDayDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {selectedDayDialog?.displayDate}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedDayDialog?.tasks.length ?? 0} {t("common.tasks", { defaultValue: "tasks" })}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 1 }}>
          <List disablePadding>
            {selectedDayDialog?.tasks.map((task) => {
              const isDone = task.status === "done";
              const priorityColor = PRIORITY_META[task.priority]?.color ?? "#6B7A99";
              return (
                <ListItem key={task.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      setSelectedDayDialog(null);
                      openEditTask(task);
                    }}
                    sx={{
                      borderRadius: 1.5,
                      borderLeft: `4px solid ${priorityColor}`,
                      bgcolor: (th) => alpha(th.palette.action.hover, 0.5),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 30 }}>{getStatusIcon(task.status)}</ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.25 }}>
                          <Typography variant="caption" sx={{ color: priorityColor, fontWeight: 700 }}>
                            {PRIORITY_META[task.priority]?.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {STATUS_META[task.status]?.label}
                          </Typography>
                          {isRecurring(task) && (
                            <Chip
                              size="small"
                              icon={<RepeatIcon sx={{ fontSize: "12px !important" }} />}
                              label={formatRecurrenceLabel(task.recurrence, t)}
                              sx={{
                                height: 18,
                                fontSize: 10,
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                color: "primary.main",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Stack>
                      }
                      primaryTypographyProps={{
                        fontWeight: 600,
                        fontSize: 14,
                        style: { textDecoration: isDone ? "line-through" : "none" },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: "space-between" }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={() => {
              const dateKey = selectedDayDialog?.dateKey;
              setSelectedDayDialog(null);
              if (dateKey) openNewTask("todo", dateKey);
            }}
          >
            {t("task.newTask", { defaultValue: "Add Task" })}
          </Button>
          <Button variant="outlined" size="small" onClick={() => setSelectedDayDialog(null)}>
            {t("common.cancel", { defaultValue: "Close" })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}