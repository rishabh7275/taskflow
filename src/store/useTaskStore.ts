import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { PaletteMode } from "@mui/material";
import type { Priority, Status, Task, TaskInput, Label, Board, ThemeMode, Density, AccentColor, Language, AppNotification, NotificationSettings } from "../types";
import { createSeedTasks, DEFAULT_PRESET_LABELS, DEFAULT_BOARD } from "../seed";
import i18n from "../lib/i18n";
import { todayISO } from "../utils";
import { createNextOccurrence } from "../lib/recurrence";

export type PriorityFilter = "all" | Priority;
export type SyncStatus = "idle" | "saving" | "saved" | "error";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  overdueAlerts: true,
  dueTodayAlerts: true,
  upcomingAlerts: true,
  upcomingLeadDays: 1,
  browserNotifications: false,
};

export interface DialogState {
  open: boolean;
  task: Task | null;
  status: Status;
  initialDueDate?: string | null;
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
  openNewTask: (status?: Status, initialDueDate?: string | null) => void;
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

  // Cloud sync & Auth
  syncStatus: SyncStatus;
  isDataLoaded: boolean;
  setSyncStatus: (status: SyncStatus) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  loadUserData: (data: Partial<TaskStore>) => void;
  loadDemoData: () => void;

  // Notifications & Reminders
  notifications: AppNotification[];
  dismissedNotificationIds: string[];
  notificationSettings: NotificationSettings;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  syncReminders: () => void;
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
    recurrence: raw.recurrence ?? null,
    recurringParentId: raw.recurringParentId ?? null,
    nextOccurrenceCreated: Boolean(raw.nextOccurrenceCreated),
  };
}

export function migrateTasksArray(arr: unknown[]): Task[] {
  return arr.map((item) => migrateTask((item || {}) as Partial<Task>));
}

function checkAndSpawnRecurring(task: Task): { updatedTask: Task; nextOccurrence: Task | null } {
  if (
    task.recurrence &&
    task.recurrence.frequency !== "none" &&
    !task.nextOccurrenceCreated
  ) {
    const updatedTask: Task = { ...task, nextOccurrenceCreated: true };
    const nextOccurrence = createNextOccurrence(updatedTask);
    return { updatedTask, nextOccurrence };
  }
  return { updatedTask: task, nextOccurrence: null };
}

const LEGACY_TASKS_KEY = "taskflow.tasks";
const LEGACY_MODE_KEY = "taskflow.mode";
export const STORAGE_KEY = "taskflow-preferences";

let skipPersist = false;

export function clearInMemoryData(): void {
  skipPersist = true;
  useTaskStore.setState({
    boards: [DEFAULT_BOARD],
    activeBoardId: DEFAULT_BOARD.id,
    tasks: [],
    availableLabels: DEFAULT_PRESET_LABELS,
    selectedTaskIds: [],
    past: [],
    future: [],
    query: "",
    filter: "all",
    dialog: { open: false, task: null, status: "todo" },
    toast: null,
    syncStatus: "idle",
    isDataLoaded: false,
    notifications: [],
    dismissedNotificationIds: [],
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
  });
  try {
    localStorage.removeItem("taskflow-storage");
    localStorage.removeItem(LEGACY_TASKS_KEY);
    localStorage.removeItem(LEGACY_MODE_KEY);
  } catch {
    // ignore
  }
  skipPersist = false;
}

const storageWithMigration: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const item = localStorage.getItem(name);
      if (item !== null) {
        return item;
      }
    } catch (e) {
      console.warn("TaskFlow: Error reading preferences from localStorage", e);
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (skipPersist) return;
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
      tasks: [],
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
      syncStatus: "idle",
      isDataLoaded: false,
      notifications: [],
      dismissedNotificationIds: [],
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,

      setSyncStatus: (syncStatus) =>
        set((state) => (state.syncStatus === syncStatus ? state : { syncStatus })),

      setIsDataLoaded: (isDataLoaded) => set({ isDataLoaded }),

      loadDemoData: () => {
        const seedTasks = createSeedTasks();
        set({
          boards: [DEFAULT_BOARD],
          activeBoardId: DEFAULT_BOARD.id,
          tasks: seedTasks,
          availableLabels: DEFAULT_PRESET_LABELS,
          selectedTaskIds: [],
          past: [],
          future: [],
          toast: { message: i18n.t("toast.demoLoaded", { defaultValue: "Demo tasks loaded" }) },
        });
      },

      loadUserData: (data) => {
        const tasks = Array.isArray(data.tasks) ? migrateTasksArray(data.tasks) : [];
        const boards =
          Array.isArray(data.boards) && data.boards.length > 0 ? data.boards : [DEFAULT_BOARD];
        const activeBoardId =
          data.activeBoardId && boards.some((b) => b.id === data.activeBoardId)
            ? data.activeBoardId
            : boards[0].id;
        const availableLabels =
          Array.isArray(data.availableLabels) && data.availableLabels.length > 0
            ? data.availableLabels
            : DEFAULT_PRESET_LABELS;

        set({
          boards,
          activeBoardId,
          tasks,
          availableLabels,
          themeMode: data.themeMode ?? get().themeMode,
          mode: data.mode ?? get().mode,
          accentColor: data.accentColor ?? get().accentColor,
          density: data.density ?? get().density,
          language: data.language ?? get().language,
          notificationSettings: data.notificationSettings
            ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...data.notificationSettings }
            : get().notificationSettings,
          notifications: Array.isArray(data.notifications) ? data.notifications : get().notifications,
          dismissedNotificationIds: Array.isArray(data.dismissedNotificationIds)
            ? data.dismissedNotificationIds
            : get().dismissedNotificationIds,
          selectedTaskIds: [],
          past: [],
          future: [],
          isDataLoaded: true,
          syncStatus: "saved",
        });
      },

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
        } catch { }
        void i18n.changeLanguage(language);
        if (typeof document !== "undefined") {
          document.documentElement.lang = language === "hi" ? "hi-IN" : "en-IN";
        }
        set({ language });
      },

      clearAllData: () => {
        set({
          boards: [DEFAULT_BOARD],
          activeBoardId: DEFAULT_BOARD.id,
          tasks: [],
          availableLabels: DEFAULT_PRESET_LABELS,
          themeMode: "light",
          mode: "light",
          accentColor: "#4F46E5",
          density: "comfortable",
          language: "en",
          selectedTaskIds: [],
          past: [],
          future: [],
          toast: { message: i18n.t("toast.allDataReset") },
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
          toast: { message: i18n.t("toast.createdBoard", { name: newBoard.name }) },
        }));
        return newBoard.id;
      },

      renameBoard: (id, name) => {
        set((state) => ({
          boards: state.boards.map((b) => (b.id === id ? { ...b, name: name.trim() || b.name } : b)),
          toast: { message: i18n.t("toast.boardRenamed") },
        }));
      },

      deleteBoard: (id) => {
        const { boards, activeBoardId, tasks } = get();
        if (boards.length <= 1) {
          set({ toast: { message: i18n.t("toast.cannotDeleteOnlyBoard") } });
          return;
        }
        const remainingBoards = boards.filter((b) => b.id !== id);
        const newActive = activeBoardId === id ? remainingBoards[0].id : activeBoardId;
        set({
          boards: remainingBoards,
          activeBoardId: newActive,
          tasks: tasks.filter((t) => t.boardId !== id),
          selectedTaskIds: [],
          toast: { message: i18n.t("toast.boardDeleted") },
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
            toast: {
              message: i18n.t("toast.importedBoard", {
                name: board.name,
                count: newTasks.length,
              }),
            },
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

      openNewTask: (status = "todo", initialDueDate = null) =>
        set({ dialog: { open: true, task: null, status, initialDueDate } }),

      openEditTask: (task) =>
        set({ dialog: { open: true, task, status: task.status, initialDueDate: null } }),

      closeDialog: () =>
        set((state) => ({ dialog: { ...state.dialog, open: false, initialDueDate: null } })),

      saveTask: (input, id) => {
        const { tasks, past, activeBoardId } = get();
        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];

        if (id) {
          const currentTask = tasks.find((t) => t.id === id);
          const wasDone = currentTask?.status === "done";
          const willBeDone = input.status === "done";
          const becameDone = !wasDone && willBeDone;

          let updatedTask: Task = {
            ...(currentTask || (input as Task)),
            ...input,
            completedAt: willBeDone ? (wasDone ? currentTask?.completedAt : Date.now()) : null,
          };

          let nextOccurrence: Task | null = null;
          if (becameDone) {
            const res = checkAndSpawnRecurring(updatedTask);
            updatedTask = res.updatedTask;
            nextOccurrence = res.nextOccurrence;
          }

          const updatedTasks = tasks.map((t) => (t.id === id ? updatedTask : t));
          if (nextOccurrence) {
            updatedTasks.unshift(nextOccurrence);
          }

          set({
            past: nextPast,
            future: [],
            tasks: updatedTasks,
            toast: { message: i18n.t("toast.taskUpdated"), undo: () => get().undo() },
            dialog: { ...get().dialog, open: false },
          });
        } else {
          let newTask: Task = {
            ...input,
            id: crypto.randomUUID(),
            boardId: activeBoardId,
            createdAt: Date.now(),
            completedAt: input.status === "done" ? Date.now() : null,
          };
          let newNextOccurrence: Task | null = null;
          if (input.status === "done") {
            const res = checkAndSpawnRecurring(newTask);
            newTask = res.updatedTask;
            newNextOccurrence = res.nextOccurrence;
          }
          set((state) => ({
            past: nextPast,
            future: [],
            tasks: newNextOccurrence ? [newNextOccurrence, newTask, ...state.tasks] : [newTask, ...state.tasks],
            toast: { message: i18n.t("toast.taskAdded"), undo: () => get().undo() },
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
        const wasDone = task.status === "done";
        const becameDone = !wasDone && isDone;

        let updatedTask: Task = {
          ...task,
          status,
          completedAt: isDone ? task.completedAt || Date.now() : null,
        };

        let nextOccurrence: Task | null = null;
        if (becameDone) {
          const res = checkAndSpawnRecurring(updatedTask);
          updatedTask = res.updatedTask;
          nextOccurrence = res.nextOccurrence;
        }

        const updatedTasks = tasks.map((t) => (t.id === id ? updatedTask : t));
        if (nextOccurrence) {
          updatedTasks.unshift(nextOccurrence);
        }

        set({
          past: nextPast,
          future: [],
          tasks: updatedTasks,
          toast: {
            message: i18n.t("toast.movedTo", { status: i18n.t(`status.${status}`) }),
            undo: () => get().undo(),
          },
        });
      },

      moveTaskToColumn: (activeId, targetStatus, targetIndex) => {
        const { tasks, past } = get();
        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        const nextPast = [...past.slice(-(MAX_HISTORY - 1)), tasks];
        const withoutActive = tasks.filter((t) => t.id !== activeId);
        const isDone = targetStatus === "done";
        const wasDone = activeTask.status === "done";
        const becameDone = !wasDone && isDone;

        let updatedTask: Task = {
          ...activeTask,
          status: targetStatus,
          completedAt: isDone ? activeTask.completedAt || Date.now() : null,
        };

        let nextOccurrence: Task | null = null;
        if (becameDone) {
          const res = checkAndSpawnRecurring(updatedTask);
          updatedTask = res.updatedTask;
          nextOccurrence = res.nextOccurrence;
        }

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

        if (nextOccurrence) {
          withoutActive.unshift(nextOccurrence);
        }

        set({
          past: nextPast,
          future: [],
          tasks: withoutActive,
          toast: {
            message: i18n.t("toast.taskMovedTo", { status: i18n.t(`status.${targetStatus}`) }),
            undo: () => get().undo(),
          },
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
        let [moved] = updated.splice(activeIdx, 1);
        const targetStatus = tasks[overIdx].status;
        const wasDone = moved.status === "done";
        const isDone = targetStatus === "done";
        const becameDone = !wasDone && isDone;

        moved.status = targetStatus;
        moved.completedAt = isDone ? moved.completedAt || Date.now() : null;

        let nextOccurrence: Task | null = null;
        if (becameDone) {
          const res = checkAndSpawnRecurring(moved);
          moved = res.updatedTask;
          nextOccurrence = res.nextOccurrence;
        }

        updated.splice(overIdx, 0, moved);
        if (nextOccurrence) {
          updated.unshift(nextOccurrence);
        }

        set({
          past: nextPast,
          future: [],
          tasks: updated,
          toast: { message: i18n.t("toast.tasksReordered"), undo: () => get().undo() },
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
            message: i18n.t("toast.taskDeleted"),
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
        const spawnedTasks: Task[] = [];
        const updatedTasks = tasks.map((t) => {
          if (!selectedTaskIds.includes(t.id)) return t;
          const wasDone = t.status === "done";
          const becameDone = !wasDone && isDone;
          let u: Task = { ...t, status, completedAt: isDone ? t.completedAt || Date.now() : null };
          if (becameDone) {
            const res = checkAndSpawnRecurring(u);
            u = res.updatedTask;
            if (res.nextOccurrence) spawnedTasks.push(res.nextOccurrence);
          }
          return u;
        });

        set({
          past: nextPast,
          future: [],
          tasks: [...spawnedTasks, ...updatedTasks],
          selectedTaskIds: [],
          toast: {
            message: i18n.t(count > 1 ? "toast.bulkMoved_other" : "toast.bulkMoved_one", {
              count,
              status: i18n.t(`status.${status}`),
            }),
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
            message: i18n.t(count > 1 ? "toast.bulkPriority_other" : "toast.bulkPriority_one", {
              count,
            }),
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
            message: i18n.t(count > 1 ? "toast.bulkDeleted_other" : "toast.bulkDeleted_one", {
              count,
            }),
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
            message: i18n.t("toast.actionUndone"),
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
            message: i18n.t("toast.actionRedone"),
            undo: () => get().undo(),
          },
        });
      },

      setToast: (toast) => set({ toast }),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          dismissedNotificationIds: state.dismissedNotificationIds.includes(id)
            ? state.dismissedNotificationIds
            : [...state.dismissedNotificationIds, id],
        })),

      clearAllNotifications: () =>
        set((state) => ({
          dismissedNotificationIds: Array.from(
            new Set([...state.dismissedNotificationIds, ...state.notifications.map((n) => n.id)])
          ),
          notifications: [],
        })),

      updateNotificationSettings: (patch) => {
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...patch },
        }));
        get().syncReminders();
      },

      syncReminders: () => {
        const { tasks, notifications, dismissedNotificationIds, notificationSettings } = get();
        if (!notificationSettings.enabled) {
          return;
        }

        const today = todayISO();
        const dismissedSet = new Set(dismissedNotificationIds);

        // Filter out notifications for tasks that are completed or deleted
        const validNotifications = notifications.filter((n) => {
          if (!n.taskId) return true;
          const task = tasks.find((t) => t.id === n.taskId);
          if (!task || task.status === "done") return false;
          return true;
        });

        const existingIds = new Set(validNotifications.map((n) => n.id));
        const newlyCreated: AppNotification[] = [];

        for (const task of tasks) {
          if (task.status === "done" || !task.dueDate || !task.dueDate.trim()) {
            continue;
          }

          const dueStr = task.dueDate.trim();

          // 1. Overdue reminder
          if (notificationSettings.overdueAlerts && dueStr < today) {
            const notifId = `overdue-${task.id}-${dueStr}`;
            if (!existingIds.has(notifId) && !dismissedSet.has(notifId)) {
              const notif: AppNotification = {
                id: notifId,
                type: "overdue",
                title: `Overdue: ${task.title}`,
                message: `Due date was ${dueStr}. Task is still pending.`,
                timestamp: Date.now(),
                read: false,
                taskId: task.id,
                boardId: task.boardId,
              };
              validNotifications.unshift(notif);
              newlyCreated.push(notif);
              existingIds.add(notifId);
            }
          }
          // 2. Due Today reminder
          else if (notificationSettings.dueTodayAlerts && dueStr === today) {
            const notifId = `due_today-${task.id}-${dueStr}`;
            if (!existingIds.has(notifId) && !dismissedSet.has(notifId)) {
              const notif: AppNotification = {
                id: notifId,
                type: "due_today",
                title: `Due Today: ${task.title}`,
                message: `This task is due for completion today.`,
                timestamp: Date.now(),
                read: false,
                taskId: task.id,
                boardId: task.boardId,
              };
              validNotifications.unshift(notif);
              newlyCreated.push(notif);
              existingIds.add(notifId);
            }
          }
          // 3. Upcoming deadline reminder
          else if (notificationSettings.upcomingAlerts && dueStr > today) {
            const dueTime = new Date(`${dueStr}T00:00:00`).getTime();
            const todayTime = new Date(`${today}T00:00:00`).getTime();
            const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

            if (diffDays <= notificationSettings.upcomingLeadDays && diffDays > 0) {
              const notifId = `upcoming-${task.id}-${dueStr}`;
              if (!existingIds.has(notifId) && !dismissedSet.has(notifId)) {
                const notif: AppNotification = {
                  id: notifId,
                  type: "upcoming",
                  title: `Upcoming: ${task.title}`,
                  message: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""} on ${dueStr}.`,
                  timestamp: Date.now(),
                  read: false,
                  taskId: task.id,
                  boardId: task.boardId,
                };
                validNotifications.unshift(notif);
                newlyCreated.push(notif);
                existingIds.add(notifId);
              }
            }
          }
        }

        // Trigger browser notification for newly generated items if enabled & permitted
        if (
          notificationSettings.browserNotifications &&
          newlyCreated.length > 0 &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          for (const notif of newlyCreated.slice(0, 3)) {
            try {
              new Notification(notif.title, {
                body: notif.message,
                icon: "/favicon.ico",
              });
            } catch {
              // ignore browser notification errors
            }
          }
        }

        set({ notifications: validNotifications });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => storageWithMigration),
      partialize: (state) => ({
        themeMode: state.themeMode,
        mode: state.mode,
        accentColor: state.accentColor,
        density: state.density,
        language: state.language,
        notificationSettings: state.notificationSettings,
        notifications: state.notifications,
        dismissedNotificationIds: state.dismissedNotificationIds,
      }),
    }
  )
);
