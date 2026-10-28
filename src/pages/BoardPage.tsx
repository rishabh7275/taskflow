import AIAssistant from "../components/AIAssistant";
import SmartPlannerDialog from "../components/SmartPlannerDialog";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";


import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import FileDownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadIcon from "@mui/icons-material/FileUploadOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TableChartIcon from "@mui/icons-material/TableChartOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useSearchParams } from "react-router-dom";
import Column from "../components/Column";
import StatsBar from "../components/StatsBar";
import TaskCard from "../components/TaskCard";
import BulkActionBar from "../components/BulkActionBar";
import TodayWidget from "../components/TodayWidget";
import { useTaskStore, type PriorityFilter } from "../store";
import type { Status, Task } from "../types";
import { PRIORITIES, PRIORITY_RANK, STATUSES, addDays, isOverdue, todayISO } from "../utils";
import { exportBoardAsJSON, exportTasksAsCSV, parseAndValidateImportJSON } from "../lib/dataTools";

type DueFilter = "all" | "today" | "week" | "overdue";
type SortOption = "newest" | "priority" | "dueDate";

export default function BoardPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const allTasks = useTaskStore((s) => s.tasks);
  const boards = useTaskStore((s) => s.boards);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const query = useTaskStore((s) => s.query);
  const openNewTask = useTaskStore((s) => s.openNewTask);
  const openEditTask = useTaskStore((s) => s.openEditTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const moveTaskToColumn = useTaskStore((s) => s.moveTaskToColumn);
  const reorderTask = useTaskStore((s) => s.reorderTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const undo = useTaskStore((s) => s.undo);
  const redo = useTaskStore((s) => s.redo);
  const availableLabels = useTaskStore((s) => s.availableLabels);
  const importBoardAndTasks = useTaskStore((s) => s.importBoardAndTasks);
  const loadDemoData = useTaskStore((s) => s.loadDemoData);
  const setToast = useTaskStore((s) => s.setToast);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dataMenuAnchor, setDataMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [smartPlannerOpen, setSmartPlannerOpen] = useState(false);

  // Read URL query params with defaults
  const priorityFilter = (searchParams.get("priority") as PriorityFilter) || "all";
  const labelFilter = searchParams.get("label") || "all";
  const dueFilter = (searchParams.get("due") as DueFilter) || "all";
  const sortOption = (searchParams.get("sort") as SortOption) || "newest";

  // Update query params helper
  const updateFilterParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all" || (key === "sort" && value === "newest")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters =
    priorityFilter !== "all" || labelFilter !== "all" || dueFilter !== "all" || sortOption !== "newest";

  // Active board
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  // Tasks belonging to active board
  const boardTasks = useMemo(() => {
    return allTasks.filter((t) => t.boardId === activeBoardId);
  }, [allTasks, activeBoardId]);

  // Setup dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Undo / Redo keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Filter & sort tasks
  const isFiltering = query.trim() !== "" || hasActiveFilters;

  const byStatus = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = todayISO();
    const inAWeek = addDays(7);

    const filtered = boardTasks.filter((t) => {
      // Search
      if (
        q !== "" &&
        !t.title.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q) &&
        (!t.notes || !t.notes.toLowerCase().includes(q)) &&
        !t.labels.some((l) => l.name.toLowerCase().includes(q))
      ) {
        return false;
      }

      // Priority
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }

      // Label
      if (labelFilter !== "all" && !t.labels.some((l) => l.id === labelFilter)) {
        return false;
      }

      // Due date
      if (dueFilter === "today" && t.dueDate !== today) {
        return false;
      }
      if (dueFilter === "week" && (!t.dueDate || t.dueDate < today || t.dueDate > inAWeek)) {
        return false;
      }
      if (dueFilter === "overdue" && !isOverdue(t)) {
        return false;
      }

      return true;
    });

    // Group by status
    const groups: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
    for (const t of filtered) groups[t.status].push(t);

    // Apply sorting
    for (const s of STATUSES) {
      if (sortOption === "priority") {
        groups[s].sort(
          (a, b) =>
            PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt - a.createdAt
        );
      } else if (sortOption === "dueDate") {
        groups[s].sort((a, b) => {
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return b.createdAt - a.createdAt;
        });
      } else if (sortOption === "newest") {
        // preserve manual order unless sorted
      }
    }

    return groups;
  }, [boardTasks, query, priorityFilter, labelFilter, dueFilter, sortOption]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = boardTasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeItem = boardTasks.find((t) => t.id === activeId);
    if (!activeItem) return;

    // Over a column
    if (STATUSES.includes(overId as Status)) {
      const targetCol = overId as Status;
      if (activeItem.status !== targetCol) {
        moveTaskToColumn(activeId, targetCol);
      }
      return;
    }

    // Over another task
    const overItem = boardTasks.find((t) => t.id === overId);
    if (overItem && activeItem.status !== overItem.status) {
      moveTaskToColumn(activeId, overItem.status);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    if (STATUSES.includes(overId as Status)) {
      moveTaskToColumn(activeId, overId as Status);
      return;
    }

    const activeItem = boardTasks.find((t) => t.id === activeId);
    const overItem = boardTasks.find((t) => t.id === overId);
    if (!activeItem || !overItem) return;

    if (activeItem.status === overItem.status) {
      reorderTask(activeId, overId);
    } else {
      moveTaskToColumn(activeId, overItem.status);
    }
  };

  // Import JSON handler
  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { board: importedBoard, tasks: importedTasks } = await parseAndValidateImportJSON(text);
      importBoardAndTasks(importedBoard, importedTasks);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import JSON file";
      setToast({ message: msg });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
          {/* Board Stats */}
          <StatsBar tasks={boardTasks} />

          {/* Board Header & Data Tools */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              mt: 4,
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="h5" component="h2" fontWeight={700}>
                {activeBoard?.name || t("nav.board")}
              </Typography>
              <Chip
                size="small"
                label={t("board.taskCount", { count: boardTasks.length })}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={() => setSmartPlannerOpen(true)}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  px: 1.75,
                  py: 0.6,
                  boxShadow: (theme) => `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                  "&:hover": {
                    boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
                  },
                }}
              >
                {t("board.aiSmartPlanner", { defaultValue: "AI Smart Planner" })}
              </Button>

              <input
                id="board-import-file-input"
                name="boardImportFile"
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImportFile}
                aria-label={t("board.importJSON")}
              />

              <Button
                size="small"
                variant="outlined"
                startIcon={<MoreHorizIcon />}
                onClick={(e) => setDataMenuAnchor(e.currentTarget)}
              >
                {t("board.dataTools")}
              </Button>

              <Menu
                anchorEl={dataMenuAnchor}
                open={Boolean(dataMenuAnchor)}
                onClose={() => setDataMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    if (activeBoard) exportBoardAsJSON(activeBoard, allTasks);
                    setDataMenuAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("palette.exportJson")}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (activeBoard) exportTasksAsCSV(activeBoard, allTasks);
                    setDataMenuAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <TableChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("palette.exportCsv")}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setDataMenuAnchor(null);
                    fileInputRef.current?.click();
                  }}
                >
                  <ListItemIcon>
                    <FileUploadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("settings.importJSON")}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    loadDemoData();
                    setDataMenuAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <RestartAltIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("board.loadDemo")}</ListItemText>
                </MenuItem>
              </Menu>
            </Stack>
          </Box>

          {/* Advanced Filters Bar (URL query param bound) */}
          <Box
            sx={{
              p: 1.5,
              mb: 3,
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {/* Priority filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="priority-filter-label" htmlFor="priority-filter-select">
                {t("priority.label")}
              </InputLabel>
              <Select
                id="priority-filter-select"
                name="priorityFilter"
                labelId="priority-filter-label"
                value={priorityFilter}
                label={t("priority.label")}
                onChange={(e) => updateFilterParam("priority", e.target.value)}
                inputProps={{
                  id: "priority-filter-select",
                  name: "priorityFilter",
                  "aria-labelledby": "priority-filter-label",
                }}
              >
                <MenuItem value="all">{t("priority.all")}</MenuItem>
                {PRIORITIES.map((p) => (
                  <MenuItem key={p} value={p}>
                    {t(`priority.${p}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Label filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="label-filter-label" htmlFor="label-filter-select">
                {t("board.filterLabel")}
              </InputLabel>
              <Select
                id="label-filter-select"
                name="labelFilter"
                labelId="label-filter-label"
                value={labelFilter}
                label={t("board.filterLabel")}
                onChange={(e) => updateFilterParam("label", e.target.value)}
                inputProps={{
                  id: "label-filter-select",
                  name: "labelFilter",
                  "aria-labelledby": "label-filter-label",
                }}
              >
                <MenuItem value="all">{t("board.allLabels")}</MenuItem>
                {availableLabels.map((lbl) => (
                  <MenuItem key={lbl.id} value={lbl.id}>
                    {lbl.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Due date filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id="due-filter-label" htmlFor="due-filter-select">
                {t("task.dueDate")}
              </InputLabel>
              <Select
                id="due-filter-select"
                name="dueFilter"
                labelId="due-filter-label"
                value={dueFilter}
                label={t("task.dueDate")}
                onChange={(e) => updateFilterParam("due", e.target.value)}
                inputProps={{
                  id: "due-filter-select",
                  name: "dueFilter",
                  "aria-labelledby": "due-filter-label",
                }}
              >
                <MenuItem value="all">{t("board.allDates")}</MenuItem>
                <MenuItem value="today">{t("today.dueToday")}</MenuItem>
                <MenuItem value="week">{t("board.dueThisWeek")}</MenuItem>
                <MenuItem value="overdue">{t("today.overdue")}</MenuItem>
              </Select>
            </FormControl>

            {/* Sort option */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="sort-filter-label" htmlFor="sort-filter-select">
                {t("board.sortBy")}
              </InputLabel>
              <Select
                id="sort-filter-select"
                name="sortOption"
                labelId="sort-filter-label"
                value={sortOption}
                label={t("board.sortBy")}
                onChange={(e) => updateFilterParam("sort", e.target.value)}
                inputProps={{
                  id: "sort-filter-select",
                  name: "sortOption",
                  "aria-labelledby": "sort-filter-label",
                }}
              >
                <MenuItem value="newest">{t("board.sortNewest")}</MenuItem>
                <MenuItem value="priority">{t("board.sortPriority")}</MenuItem>
                <MenuItem value="dueDate">{t("board.sortDueDate")}</MenuItem>
              </Select>
            </FormControl>

            {/* Reset button */}
            {hasActiveFilters && (
              <Tooltip title={t("board.resetFiltersTooltip")}>
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={handleResetFilters}
                  sx={{ ml: "auto" }}
                >
                  {t("common.reset")}
                </Button>
              </Tooltip>
            )}
          </Box>

          {/* Today's Agenda Widget */}
          <TodayWidget tasks={boardTasks} onEdit={openEditTask} />

          {/* Columns Grid */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              alignItems: "start",
            }}
          >
            {STATUSES.map((s) => (
              <Column
                key={s}
                status={s}
                tasks={byStatus[s]}
                isFiltering={isFiltering}
                onMove={moveTask}
                onAdd={openNewTask}
                onEdit={openEditTask}
                onDelete={deleteTask}
              />
            ))}
          </Box>
        </Container>

        {/* Floating Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onEdit={openEditTask}
              onDelete={deleteTask}
              onMove={moveTask}
              isOverlay
            />
          ) : null}
        </DragOverlay>

        {/* Bulk Action Bar */}
        <BulkActionBar />
      </DndContext>

      <AIAssistant />
      <SmartPlannerDialog
        open={smartPlannerOpen}
        onClose={() => setSmartPlannerOpen(false)}
        tasks={boardTasks}
        boardName={activeBoard?.name}
      />
    </>
  );
}
