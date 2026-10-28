import type { RecurrenceConfig, RecurrenceFrequency, Task } from "../types";
export type { RecurrenceConfig, RecurrenceFrequency };
import { todayISO } from "./utils";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatCalendarDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseISODateParts(iso: string): [number, number, number] {
  const parts = iso.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return [parts[0], parts[1], parts[2]];
  }
  const todayParts = todayISO().split("-").map(Number);
  return [todayParts[0], todayParts[1], todayParts[2]];
}

/**
 * Calculates the next occurrence date for a recurring task based on its schedule.
 * Uses strict calendar arithmetic to prevent timezone drifts and daylight saving jumps.
 */
export function computeNextOccurrenceDate(
  recurrence: RecurrenceConfig,
  currentDueDate: string | null
): string {
  const today = todayISO();
  const baseIso = currentDueDate || today;
  const [by, bm, bd] = parseISODateParts(baseIso);
  const [ty, tm, td] = parseISODateParts(today);

  if (recurrence.frequency === "daily") {
    const dObj = new Date(by, bm - 1, bd);
    dObj.setDate(dObj.getDate() + 1);
    let nextIso = formatCalendarDate(dObj.getFullYear(), dObj.getMonth() + 1, dObj.getDate());
    // If the completed occurrence was in the past, advance to next upcoming day after today
    while (nextIso <= today) {
      dObj.setDate(dObj.getDate() + 1);
      nextIso = formatCalendarDate(dObj.getFullYear(), dObj.getMonth() + 1, dObj.getDate());
    }
    return nextIso;
  }

  if (recurrence.frequency === "weekly") {
    const baseDayOfWeek = new Date(by, bm - 1, bd).getDay();
    const weekdays =
      recurrence.weekdays && recurrence.weekdays.length > 0
        ? recurrence.weekdays
        : [baseDayOfWeek];

    let dObj = new Date(by, bm - 1, bd);
    const todayObj = new Date(ty, tm - 1, td);
    if (dObj < todayObj) {
      dObj = todayObj;
    }

    for (let i = 0; i < 14; i++) {
      dObj.setDate(dObj.getDate() + 1);
      if (weekdays.includes(dObj.getDay())) {
        return formatCalendarDate(dObj.getFullYear(), dObj.getMonth() + 1, dObj.getDate());
      }
    }
    return formatCalendarDate(dObj.getFullYear(), dObj.getMonth() + 1, dObj.getDate());
  }

  if (recurrence.frequency === "monthly") {
    const targetDay = recurrence.monthDay || bd;
    const dObj = new Date(by, bm - 1, bd);
    const todayObj = new Date(ty, tm - 1, td);
    if (dObj < todayObj) {
      dObj.setTime(todayObj.getTime());
    }

    const curYear = dObj.getFullYear();
    let curMonth = dObj.getMonth();

    while (true) {
      curMonth += 1;
      const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
      const actualDay = Math.min(targetDay, daysInMonth);
      const candidateObj = new Date(curYear, curMonth, actualDay);
      const candidateIso = formatCalendarDate(
        candidateObj.getFullYear(),
        candidateObj.getMonth() + 1,
        candidateObj.getDate()
      );
      if (candidateIso > today) {
        return candidateIso;
      }
    }
  }

  return baseIso;
}

/**
 * Creates the next occurrence of a completed recurring task.
 * Gives the new task a fresh unique ID, resets status to 'todo', clears completedAt,
 * regenerates fresh subtask IDs, and preserves all recurrence and metadata settings.
 */
export function createNextOccurrence(task: Task): Task {
  if (!task.recurrence || task.recurrence.frequency === "none") {
    throw new Error("TaskFlow: Cannot create next occurrence for a non-recurring task");
  }

  const nextDueDate = computeNextOccurrenceDate(task.recurrence, task.dueDate);

  return {
    ...task,
    id: crypto.randomUUID(),
    status: "todo",
    dueDate: nextDueDate,
    createdAt: Date.now(),
    completedAt: null,
    subtasks: (task.subtasks || []).map((st) => ({
      ...st,
      id: crypto.randomUUID(),
      completed: false,
    })),
    recurrence: { ...task.recurrence },
    recurringParentId: task.recurringParentId || task.id,
    nextOccurrenceCreated: false,
  };
}

export function isRecurring(
  task: Task | null | undefined
): task is Task & { recurrence: RecurrenceConfig } {
  return Boolean(task?.recurrence && task.recurrence.frequency !== "none");
}

export const WEEKDAY_LABELS = [
  { value: 0, label: "Sun", full: "Sunday" },
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
];

export function formatRecurrenceLabel(
  recurrence: RecurrenceConfig | null | undefined,
  t?: (key: string) => string
): string {
  if (!recurrence || recurrence.frequency === "none") return "";
  const translate = (key: string, defaultVal: string) => {
    if (!t) return defaultVal;
    const res = t(key);
    return res && res !== key ? res : defaultVal;
  };

  if (recurrence.frequency === "daily") {
    return translate("recurrence.daily", "Repeats daily");
  }

  if (recurrence.frequency === "weekly") {
    if (recurrence.weekdays && recurrence.weekdays.length > 0) {
      const daysStr = recurrence.weekdays
        .slice()
        .sort((a, b) => a - b)
        .map((w) => WEEKDAY_LABELS.find((l) => l.value === w)?.label || "")
        .filter(Boolean)
        .join(", ");
      return `${translate("recurrence.weekly", "Repeats weekly")}: ${daysStr}`;
    }
    return translate("recurrence.weekly", "Repeats weekly");
  }

  if (recurrence.frequency === "monthly") {
    if (recurrence.monthDay) {
      return `${translate("recurrence.monthly", "Repeats monthly")} (day ${recurrence.monthDay})`;
    }
    return translate("recurrence.monthly", "Repeats monthly");
  }

  return "";
}
