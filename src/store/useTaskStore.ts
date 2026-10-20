import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { PaletteMode } from "@mui/material";
import type { Priority, Status, Task, TaskInput, Label, Board, ThemeMode, Density, AccentColor, Language } from "../types";
import { createSeedTasks, DEFAULT_PRESET_LABELS, DEFAULT_BOARD } from "../seed";

export type PriorityFilter = "all" | Priority;

export interface DialogState {
  open: boolean;
  task: Task | null;
  status: Status;
}

export interface Toast {
  message: string;
  undo?: () => void;
  redo?: () => void;
}

export interface TaskStore {
  boards: Board[];
  activeBoardId: string;
  tasks: Task[];
  availableLabels: Label[];
  themeMode: ThemeMode;
  mode: PaletteMode;
  accentColor: AccentColor;
  density: Density;
  language: Language;
  query: string;
  filter: PriorityFilter;
  dialog: DialogState;
  toast: Toast | null;
  selectedTaskIds: string[];
  past: Task[][];
  future: Task[][];
  isShortcutsOpen: boolean;
  isCommandPaletteOpen: boolean;

  // Settings & Preferences
  setThemeMode: (themeMode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setDensity: (density: Density) => void;
  setLanguage: (lang: Language) => void;
  clearAllData: () => void;

  // Board management
  setActiveBoardId: (id: string) => void;
  createBoard: (name: string, description?: string) => string;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  importBoardAndTasks: (board: Board, newTasks: Task[]) => void;

  // Dialog & shortcut controls
  setShortcutsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Store actions
  setTasks: (updater: Task[] | ((prev: Task[]) => Task[])) => void;
  setMode: (updater: PaletteMode | ((prev: PaletteMode) => PaletteMode)) => void;
  toggleMode: () => void;
  setQuery: (query: string) => void;
  setFilter: (filter: PriorityFilter) => void;
  openNewTask: (status?: Status) => void;
  openEditTask: (task: Task) => void;
  closeDialog: () => void;
  saveTask: (input: TaskInput, id?: string) => void;
  moveTask: (id: string, status: Status) => void;
  moveTaskToColumn: (activeId: string, targetStatus: Status, targetIndex?: number) => void;
  reorderTask: (activeId: string, overId: string) => void;
  deleteTask: (task: Task) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addCustomLabel: (label: Label) => void;

  // Selection & Bulk actions
  toggleSelectTask: (id: string) => void;
  selectTask: (id: string, selected: boolean) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
  bulkMove: (status: Status) => void;
  bulkSetPriority: (priority: Priority) => void;
  bulkDelete: () => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  setToast: (toast: Toast | null) => void;
}

export function migrateTask(raw: Partial<Task>): Task {
  return {
    id: raw.id ?? crypto.randomUUID(),
    boardId: raw.boardId ?? DEFAULT_BOARD.id,
    title: raw.title ?? "Untitled task",
    description: raw.description ?? "",
    status: raw.status ?? "todo",
    priority: raw.priority ?? "medium",
    dueDate: raw.dueDate ?? null,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    completedAt: raw.status === "done" ? (raw.completedAt ?? Date.now()) : null,
    labels: Array.isArray(raw.labels) ? raw.labels : [],
    subtasks: Array.isArray(raw.subtasks)
      ? raw.subtasks.map((s, idx) => ({
          id: s.id ?? `sub-${idx + 1}`,
          title: s.title ?? "",
          completed: Boolean(s.completed),
        }))
      : [],
    estimatedTime: raw.estimatedTime ?? "",
    notes: raw.notes ?? "",
  };
}

export function migrateTasksArray(arr: unknown[]): Task[] {
  return arr.map((item) => migrateTask((item || {}) as Partial<Task>));
}

const LEGACY_TASKS_KEY = "taskflow.tasks";
const LEGACY_MODE_KEY = "taskflow.mode";
export const STORAGE_KEY = "taskflow-storage";

const storageWithMigration: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const item = localStorage.getItem(name);
      if (item !== null) {
        const parsed = JSON.parse(item);
        if (parsed?.state?.tasks && Array.isArray(parsed.state.tasks)) {
          parsed.state.tasks = migrateTasksArray(parsed.state.tasks);
        }
        if (!parsed?.state?.boards || !Array.isArray(parsed.state.boards) || parsed.state.boards.length === 0) {
          if (!parsed.state) parsed.state = {};
          parsed.state.boards = [DEFAULT_BOARD];
          parsed.state.activeBoardId = DEFAULT_BOARD.id;
        }
        return JSON.stringify(parsed);
      }

      // Check for legacy localStorage data
      const legacyTasksRaw = localStorage.getItem(LEGACY_TASKS_KEY);
      if (legacyTasksRaw !== null) {
        const legacyTasks = JSON.parse(legacyTasksRaw);
        let mode: PaletteMode = "light";
        const legacyModeRaw = localStorage.getItem(LEGACY_MODE_KEY);
        if (legacyModeRaw !== null) {
          try {
            const parsed = JSON.parse(legacyModeRaw);
            if (parsed === "light" || parsed === "dark") {
              mode = parsed;
            }
          } catch {
            // ignore
          }
        }

        const migrated = JSON.stringify({
          state: {
            boards: [DEFAULT_BOARD],
            activeBoardId: DEFAULT_BOARD.id,
            tasks: Array.isArray(legacyTasks) ? migrateTasksArray(legacyTasks) : createSeedTasks(),
            availableLabels: DEFAULT_PRESET_LABELS,
            themeMode: mode,
            mode,
            accentColor: "#4F46E5",
            density: "comfortable",
            language: "en",
          },
          version: 0,
        });
        localStorage.setItem(name, migrated);
        return migrated;
      }
    } catch (e) {
      console.warn("TaskFlow: Error migrating legacy tasks from localStorage", e);
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn("TaskFlow: Error saving to localStorage", e);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

const MAX_HISTORY = 30;

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      boards: [DEFAULT_BOARD],
      activeBoardId: DEFAULT_BOARD.id,
      tasks: createSeedTasks(),
      availableLabels: DEFAULT_PRESET_LABELS,
      themeMode: "light",
      mode: "light",
      accentColor: "#4F46E5",
      density: "comfortable",
      language: "en",
      query: "",
      filter: "all",
      dialog: { open: false, task: null, status: "todo" },
      toast: null,
      selectedTaskIds: [],
      past: [],
      future: [],
      isShortcutsOpen: false,
      isCommandPaletteOpen: false,

      // Settings actions
      setThemeMode: (themeMode) => {
        let effectiveMode: PaletteMode = "light";
        if (themeMode === "system") {
          effectiveMode =
            typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
        } else {
          effectiveMode = themeMode;
        }
        set({ themeMode, mode: effectiveMode });
      },

      setAccentColor: (accentColor) => set({ accentColor }),
      setDensity: (density) => set({ density }),
      setLanguage: (language) => {
        try {
          localStorage.setItem("taskflow.language", language);
        } catch {}
        set({ language });
      },

      clearAllData: () => {
        set({
          boards: [DEFAULT_BOARD],
          activeBoardId: DEFAULT_BOARD.id,
          tasks: createSeedTasks(),
          availableLabels: DEFAULT_PRESET_LABELS,
          themeMode: "light",
          mode: "light",
          accentColor: "#4F46E5",
          density: "comfortable",
          language: "en",
          selectedTaskIds: [],
          past: [],
          future: [],
          toast: { message: "All workspace data reset to defaults" },
        });
      },

      // Board actions
      setActiveBoardId: (id) => {
        set({ activeBoardId: id, selectedTaskIds: [] });
      },

      createBoard: (name, description = "") => {
        const newBoard: Board = {
          id: `board-${Date.now()}`,
          name: name.trim() || "Untitled Board",
          description: description.trim(),
          createdAt: Date.now(),
        };
        set((state) => ({
          boards: [...state.boards, newBoard],
          activeBoardId: newBoard.id,
          selectedTaskIds: [],
          toast: { message: `Created board "${newBoard.name}"` },
        }));
        return newBoard.id;
      },

      renameBoard: (id, name) => {
        set((state) => ({
          boards: state.boards.map((b) => (b.id === id ? { ...b, name: name.trim() || b.name } : b)),
          toast: { message: "Board renamed" },
        }));
      },

      deleteBoard: (id) => {
        const { boards, activeBoardId, tasks } = get();
        if (boards.length <= 1) {
          set({ toast: { message: "Cannot delete the only remaining board" } });
          return;
        }
        const remainingBoards = boards.filter((b) => b.id !== id);
        const newActive = activeBoardId === id ? remainingBoards[0].id : activeBoardId;
        set({
          boards: remainingBoards,
          activeBoardId: newActive,
          tasks: tasks.filter((t) => t.boardId !== id),
          selectedTaskIds: [],
          toast: { message: "Board deleted" },
        });
      },

      importBoardAndTasks: (board, newTasks) => {
        set((state) => {
          const boards = state.boards.some((b) => b.id === board.id)
            ? state.boards.map((b) => (b.id === board.id ? board : b))
            : [...state.boards, board];
          const tasksWithoutImported = state.tasks.filter((t) => t.boardId !== board.id);
          return {
            boards,
            activeBoardId: board.id,
            tasks: [...tasksWithoutImported, ...newTasks],
            selectedTaskIds: [],
            toast: { message: `Imported board "${board.name}" with ${newTasks.length} tasks` },
          };
        });
      },

      setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

      setTasks: (updater) =>
        set((state) => ({
          tasks: typeof updater === "function" ? updater(state.tasks) : updater,
        })),

      setMode: (updater) =>
        set((state) => ({
          mode: typeof updater === "function" ? updater(state.mode) : updater,
        })),

      toggleMode: () =>
        set((state) => {
          const next = state.mode === "dark" ? "light" : "dark";
          return {
            mode: next,
            themeMode: next,
          };
        }),

      setQuery: (query) => set({ query }),

      setFilter: (filter) => set({ filter }),

      openNewTask: (status = "todo") =>
        set({ dialog: { open: true, task: null, status } }),

      openEditTask: (task) =>
        set({ dialog: { open: true, task, status: task.status } }),

      closeDialog: () =>
        set((state) => ({ dialog: { ...state.dialog, open: false } })),

      saveTask: (input, id) => {
        const { tasks, past, activeBoardId } = get();
        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];

        if (id) {
          set((state) => ({
            past: nextPast,
            future: [],
            tasks: state.tasks.map((t) => {
              if (t.id !== id) return t;
              const willBeDone = input.status === "done";
              const wasDone = t.status === "done";
              return {
                ...t,
                ...input,
                completedAt: willBeDone ? (wasDone ? t.completedAt : Date.now()) : null,
              };
            }),
            toast: { message: "Task updated", undo: () => get().undo() },
            dialog: { ...state.dialog, open: false },
          }));
        } else {
          const newTask: Task = {
            ...input,
            id: crypto.randomUUID(),
            boardId: activeBoardId,
            createdAt: Date.now(),
            completedAt: input.status === "done" ? Date.now() : null,
          };
          set((state) => ({
            past: nextPast,
            future: [],
            tasks: [newTask, ...state.tasks],
            toast: { message: "Task added", undo: () => get().undo() },
            dialog: { ...state.dialog, open: false },
          }));
        }
      },

      moveTask: (id, status) => {
        const { tasks, past } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status === status) return;

        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        const isDone = status === "done";
        set({
          past: nextPast,
          future: [],
          tasks: tasks.map((t) =>
            t.id === id
              ? { ...t, status, completedAt: isDone ? t.completedAt || Date.now() : null }
              : t
          ),
          toast: { message: `Moved to ${status}`, undo: () => get().undo() },
        });
      },

      moveTaskToColumn: (activeId, targetStatus, targetIndex) => {
        const { tasks, past } = get();
        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        const withoutActive = tasks.filter((t) => t.id !== activeId);
        const isDone = targetStatus === "done";
        const updatedTask = {
          ...activeTask,
          status: targetStatus,
          completedAt: isDone ? activeTask.completedAt || Date.now() : null,
        };

        if (typeof targetIndex === "number" && targetIndex >= 0) {
          const colTasks = withoutActive.filter(
            (t) => t.boardId === activeTask.boardId && t.status === targetStatus
          );
          const targetInCol = colTasks[targetIndex];
          if (targetInCol) {
            const insertIdx = withoutActive.findIndex((t) => t.id === targetInCol.id);
            withoutActive.splice(insertIdx, 0, updatedTask);
          } else {
            withoutActive.push(updatedTask);
          }
        } else {
          withoutActive.push(updatedTask);
        }

        set({
          past: nextPast,
          future: [],
          tasks: withoutActive,
          toast: { message: `Task moved to ${targetStatus}`, undo: () => get().undo() },
        });
      },

      reorderTask: (activeId, overId) => {
        if (activeId === overId) return;
        const { tasks, past } = get();
        const activeIdx = tasks.findIndex((t) => t.id === activeId);
        const overIdx = tasks.findIndex((t) => t.id === overId);
        if (activeIdx === -1 || overIdx === -1) return;

        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        const updated = [...tasks];
        const [moved] = updated.splice(activeIdx, 1);
        const targetStatus = tasks[overIdx].status;
        moved.status = targetStatus;
        moved.completedAt = targetStatus === "done" ? moved.completedAt || Date.now() : null;
        updated.splice(overIdx, 0, moved);

        set({
          past: nextPast,
          future: [],
          tasks: updated,
          toast: { message: "Tasks reordered", undo: () => get().undo() },
        });
      },

      deleteTask: (task) => {
        const { tasks, past } = get();
        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        set({
          past: nextPast,
          future: [],
          tasks: tasks.filter((t) => t.id !== task.id),
          selectedTaskIds: get().selectedTaskIds.filter((id) => id !== task.id),
          toast: {
            message: "Task deleted",
            undo: () => get().undo(),
          },
        });
      },

      toggleSubtask: (taskId, subtaskId) => {
        const { tasks, past } = get();
        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        set({
          past: nextPast,
          future: [],
          tasks: tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            };
          }),
        });
      },

      addCustomLabel: (label) => {
        set((state) => {
          if (
            state.availableLabels.some(
              (l) => l.id === label.id || l.name.toLowerCase() === label.name.toLowerCase()
            )
          ) {
            return state;
          }
          return { availableLabels: [...state.availableLabels, label] };
        });
      },

      // Selection actions
      toggleSelectTask: (id) => {
        set((state) => {
          const exists = state.selectedTaskIds.includes(id);
          return {
            selectedTaskIds: exists
              ? state.selectedTaskIds.filter((item) => item !== id)
              : [...state.selectedTaskIds, id],
          };
        });
      },

      selectTask: (id, selected) => {
        set((state) => {
          const exists = state.selectedTaskIds.includes(id);
          if (selected && !exists) {
            return { selectedTaskIds: [...state.selectedTaskIds, id] };
          }
          if (!selected && exists) {
            return { selectedTaskIds: state.selectedTaskIds.filter((item) => item !== id) };
          }
          return state;
        });
      },

      selectAllTasks: (taskIds) => {
        set({ selectedTaskIds: Array.from(new Set(taskIds)) });
      },

      clearSelection: () => set({ selectedTaskIds: [] }),

      bulkMove: (status) => {
        const { tasks, past, selectedTaskIds } = get();
        if (selectedTaskIds.length === 0) return;
        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        const count = selectedTaskIds.length;
        const isDone = status === "done";
        set({
          past: nextPast,
          future: [],
          tasks: tasks.map((t) =>
            selectedTaskIds.includes(t.id)
              ? { ...t, status, completedAt: isDone ? t.completedAt || Date.now() : null }
              : t
          ),
          selectedTaskIds: [],
          toast: {
            message: `Moved ${count} task${count > 1 ? "s" : ""} to ${status}`,
            undo: () => get().undo(),
          },
        });
      },

      bulkSetPriority: (priority) => {
        const { tasks, past, selectedTaskIds } = get();
        if (selectedTaskIds.length === 0) return;
        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        const count = selectedTaskIds.length;
        set({
          past: nextPast,
          future: [],
          tasks: tasks.map((t) => (selectedTaskIds.includes(t.id) ? { ...t, priority } : t)),
          selectedTaskIds: [],
          toast: {
            message: `Updated priority for ${count} task${count > 1 ? "s" : ""}`,
            undo: () => get().undo(),
          },
        });
      },

      bulkDelete: () => {
        const { tasks, past, selectedTaskIds } = get();
        if (selectedTaskIds.length === 0) return;
        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        const count = selectedTaskIds.length;
        set({
          past: nextPast,
          future: [],
          tasks: tasks.filter((t) => !selectedTaskIds.includes(t.id)),
          selectedTaskIds: [],
          toast: {
            message: `Deleted ${count} task${count > 1 ? "s" : ""}`,
            undo: () => get().undo(),
          },
        });
      },

      // Undo / Redo
      undo: () => {
        const { past, future, tasks } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        const newFuture = [tasks, ...future.slice(0, MAX_HISTORY - 1)];

        set({
          past: newPast,
          future: newFuture,
          tasks: previous,
          toast: {
            message: "Action undone",
            redo: () => get().redo(),
          },
        });
      },

      redo: () => {
        const { past, future, tasks } = get();
        if (future.length === 0) return;
        const next = future[0];
        const newFuture = future.slice(1);
        const newPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];

        set({
          past: newPast,
          future: newFuture,
          tasks: next,
          toast: {
            message: "Action redone",
            undo: () => get().undo(),
          },
        });
      },

      setToast: (toast) => set({ toast }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => storageWithMigration),
      partialize: (state) => ({
        boards: state.boards,
        activeBoardId: state.activeBoardId,
        tasks: state.tasks,
        availableLabels: state.availableLabels,
        themeMode: state.themeMode,
        mode: state.mode,
        accentColor: state.accentColor,
        density: state.density,
        language: state.language,
      }),
    }
  )
);
