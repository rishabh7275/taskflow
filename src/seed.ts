import type { Priority, Status, Task, Label, Subtask, Board } from "./types";
import { addDays } from "./utils";

export const DEFAULT_BOARD: Board = {
  id: "default-board",
  name: "Main Board",
  description: "Primary workspace board",
  createdAt: 1700000000000,
};

export const DEFAULT_PRESET_LABELS: Label[] = [
  { id: "lbl-work", name: "Work", color: "#4F46E5" },
  { id: "lbl-personal", name: "Personal", color: "#2E9E6B" },
  { id: "lbl-finance", name: "Finance", color: "#D98B00" },
  { id: "lbl-urgent", name: "Urgent", color: "#D6453D" },
  { id: "lbl-dev", name: "Development", color: "#7A5AF8" },
];

export const SEED_TASK_TITLES = new Set([
  "Finish quarterly report",
  "Book train tickets for Diwali",
  "Reply to client emails",
  "Pay electricity bill",
  "Plan weekend trip",
  "Fix login page bug",
  "Write standup notes",
  "Renew gym membership",
]);

/**
 * Returns true if the task array consists entirely of the default seed sample tasks.
 * Used to automatically clean up user documents that were unintentionally auto-seeded in earlier builds.
 */
export function isUnintendedSeedTaskList(tasks: unknown): boolean {
  if (!Array.isArray(tasks) || tasks.length === 0) return false;
  return (
    tasks.length <= 8 &&
    tasks.every(
      (t) =>
        t &&
        typeof t === "object" &&
        "title" in t &&
        typeof t.title === "string" &&
        SEED_TASK_TITLES.has(t.title)
    )
  );
}

export function createSeedTasks(): Task[] {
  const now = Date.now();
  const ONE_DAY = 86400000;

  const make = (
    i: number,
    title: string,
    description: string,
    status: Status,
    priority: Priority,
    due: number | null,
    labels: Label[] = [],
    subtasks: Subtask[] = [],
    estimatedTime: string = "",
    notes: string = "",
    completedDaysAgo: number | null = null
  ): Task => ({
    id: crypto.randomUUID(),
    boardId: DEFAULT_BOARD.id,
    title,
    description,
    status,
    priority,
    dueDate: due === null ? null : addDays(due),
    createdAt: now - i * 1000,
    completedAt: completedDaysAgo !== null ? now - completedDaysAgo * ONE_DAY : null,
    labels,
    subtasks,
    estimatedTime,
    notes,
    recurrence: null,
    recurringParentId: null,
    nextOccurrenceCreated: false,
  });

  return [
    make(
      1,
      "Finish quarterly report",
      "Collect numbers from sales and ops, then draft the summary.",
      "doing",
      "high",
      2,
      [DEFAULT_PRESET_LABELS[0], DEFAULT_PRESET_LABELS[3]],
      [
        { id: "s1", title: "Collect sales numbers", completed: true },
        { id: "s2", title: "Draft summary slides", completed: false },
        { id: "s3", title: "Review with team lead", completed: false },
      ],
      "3h",
      "Sales sheet link is in the shared drive folder."
    ),
    make(
      2,
      "Book train tickets for Diwali",
      "Check 3AC availability and book before the window closes.",
      "todo",
      "high",
      5,
      [DEFAULT_PRESET_LABELS[1]],
      [
        { id: "s4", title: "Check IRCTC tatkal timings", completed: true },
        { id: "s5", title: "Add passenger details", completed: false },
      ],
      "30m"
    ),
    make(
      3,
      "Reply to client emails",
      "Three pending threads, one needs a revised quote.",
      "todo",
      "medium",
      0, // Due today!
      [DEFAULT_PRESET_LABELS[0]],
      [],
      "45m"
    ),
    make(
      4,
      "Pay electricity bill",
      "",
      "todo",
      "low",
      -1, // Overdue!
      [DEFAULT_PRESET_LABELS[1], DEFAULT_PRESET_LABELS[2]],
      [],
      "10m"
    ),
    make(
      5,
      "Plan weekend trip",
      "Shortlist two places and compare stays.",
      "todo",
      "low",
      null,
      [DEFAULT_PRESET_LABELS[1]],
      [
        { id: "s6", title: "Shortlist places", completed: true },
        { id: "s7", title: "Compare Airbnbs", completed: false },
      ],
      "1h"
    ),
    make(
      6,
      "Fix login page bug",
      "Password reset link redirects to a blank page on mobile.",
      "doing",
      "medium",
      1,
      [DEFAULT_PRESET_LABELS[0], DEFAULT_PRESET_LABELS[4]],
      [
        { id: "s8", title: "Reproduce on iOS Safari", completed: true },
        { id: "s9", title: "Apply redirect patch", completed: false },
      ],
      "2h",
      "Check token expiration handling in auth router."
    ),
    make(
      7,
      "Write standup notes",
      "",
      "done",
      "low",
      null,
      [DEFAULT_PRESET_LABELS[0]],
      [],
      "15m",
      "",
      1 // Completed 1 day ago
    ),
    make(
      8,
      "Renew gym membership",
      "",
      "done",
      "medium",
      -3,
      [DEFAULT_PRESET_LABELS[1], DEFAULT_PRESET_LABELS[2]],
      [],
      "15m",
      "",
      0 // Completed today
    ),
  ];
}
