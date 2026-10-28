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

export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly";

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  /** 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat */
  weekdays?: number[];
  /** Day of the month: 1..31 */
  monthDay?: number;
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
  recurrence?: RecurrenceConfig | null;
  recurringParentId?: string | null;
  nextOccurrenceCreated?: boolean;
}

export interface TaskInput {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  /** ISO date (YYYY-MM-DD) or null */
  dueDate: string | null;
  labels: Label[];
  subtasks: Subtask[];
  estimatedTime?: string;
  notes?: string;
  recurrence?: RecurrenceConfig | null;
  recurringParentId?: string | null;
  nextOccurrenceCreated?: boolean;
}

export type NotificationType = "overdue" | "due_today" | "upcoming" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  taskId?: string;
  boardId?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  overdueAlerts: boolean;
  dueTodayAlerts: boolean;
  upcomingAlerts: boolean;
  upcomingLeadDays: number;
  browserNotifications: boolean;
}
