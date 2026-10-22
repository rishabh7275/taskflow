import type { Priority, Status, Task } from "../types";

export const STATUSES: Status[] = ["todo", "doing", "done"];
export const PRIORITIES: Priority[] = ["high", "medium", "low"];

export const STATUS_META: Record<
  Status,
  { label: string; color: string; empty: string }
> = {
  todo: {
    label: "To do",
    color: "#6B7A99",
    empty: "Nothing queued. Add a task to get started.",
  },
  doing: {
    label: "In progress",
    color: "#7A5AF8",
    empty: "Drag a task here when you start working on it.",
  },
  done: {
    label: "Done",
    color: "#2E9E6B",
    empty: "Finished tasks land here.",
  },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: "High", color: "#D6453D" },
  medium: { label: "Medium", color: "#D98B00" },
  low: { label: "Low", color: "#5B84E8" },
};

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const pad = (n: number) => String(n).padStart(2, "0");

const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISO(new Date());

export const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
};

export const formatDue = (iso: string, locale: string = "en-IN") =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });

export const isOverdue = (task: Task) =>
  task.dueDate !== null && task.status !== "done" && task.dueDate < todayISO();
