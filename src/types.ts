export type Status = "todo" | "doing" | "done";
export type Priority = "low" | "medium" | "high";
export type ThemeMode = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";
export type AccentColor = "#4F46E5" | "#7C3AED" | "#059669" | "#E11D48" | "#D97706";
export type Language = "en" | "hi";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  /** ISO date (YYYY-MM-DD) or null */
  dueDate: string | null;
  createdAt: number;
  completedAt?: number | null;
  labels: Label[];
  subtasks: Subtask[];
  estimatedTime?: string;
  notes?: string;
}

export type TaskInput = Omit<Task, "id" | "createdAt" | "boardId" | "completedAt">;
