import { z } from "zod";
import type { Board, Priority, Status, Task } from "../types";

const importLabelSchema = z.object({
  id: z.string().default(() => `lbl-${Date.now()}`),
  name: z.string().min(1),
  color: z.string().default("#4F46E5"),
});

const importSubtaskSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  title: z.string().min(1),
  completed: z.boolean().default(false),
});

const importTaskSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  boardId: z.string().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().default(""),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().nullable().default(null),
  createdAt: z.number().default(() => Date.now()),
  labels: z.array(importLabelSchema).default([]),
  subtasks: z.array(importSubtaskSchema).default([]),
  estimatedTime: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

const importBoardSchema = z.object({
  version: z.number().optional().default(1),
  board: z.object({
    id: z.string().default(() => crypto.randomUUID()),
    name: z.string().min(1, "Board name is required"),
    description: z.string().optional(),
    createdAt: z.number().default(() => Date.now()),
  }),
  tasks: z.array(importTaskSchema).default([]),
});

export function exportBoardAsJSON(board: Board, tasks: Task[]): void {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    board: {
      id: board.id,
      name: board.name,
      description: board.description,
      createdAt: board.createdAt,
    },
    tasks: tasks.filter((t) => t.boardId === board.id),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `taskflow-${board.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}-${new Date().toISOString().slice(0, 10)}.json`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseAndValidateImportJSON(
  fileText: string
): Promise<{ board: Board; tasks: Task[] }> {
  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(fileText);
  } catch {
    throw new Error("Invalid JSON format. Please upload a valid JSON file.");
  }

  const result = importBoardSchema.safeParse(parsedRaw);
  if (!result.success) {
    const errorMsg = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Validation failed: ${errorMsg}`);
  }

  const { board: parsedBoard, tasks: parsedTasks } = result.data;
  const boardId = parsedBoard.id || crypto.randomUUID();

  const board: Board = {
    id: boardId,
    name: parsedBoard.name,
    description: parsedBoard.description,
    createdAt: parsedBoard.createdAt,
  };

  const tasks: Task[] = parsedTasks.map((t) => ({
    id: t.id || crypto.randomUUID(),
    boardId,
    title: t.title,
    description: t.description,
    status: t.status as Status,
    priority: t.priority as Priority,
    dueDate: t.dueDate,
    createdAt: t.createdAt,
    labels: t.labels,
    subtasks: t.subtasks,
    estimatedTime: t.estimatedTime,
    notes: t.notes,
  }));

  return { board, tasks };
}

function escapeCSV(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportTasksAsCSV(board: Board, tasks: Task[]): void {
  const boardTasks = tasks.filter((t) => t.boardId === board.id);

  const headers = [
    "Task ID",
    "Title",
    "Status",
    "Priority",
    "Due Date",
    "Estimated Time",
    "Labels",
    "Subtasks (Completed/Total)",
    "Created Date",
    "Description",
    "Notes",
  ];

  const rows = boardTasks.map((t) => {
    const labelNames = t.labels.map((l) => l.name).join("; ");
    const subtasksSummary = `${t.subtasks.filter((s) => s.completed).length}/${t.subtasks.length}`;
    const createdDate = new Date(t.createdAt).toLocaleDateString("en-IN");

    return [
      escapeCSV(t.id),
      escapeCSV(t.title),
      escapeCSV(t.status),
      escapeCSV(t.priority),
      escapeCSV(t.dueDate ?? ""),
      escapeCSV(t.estimatedTime ?? ""),
      escapeCSV(labelNames),
      escapeCSV(subtasksSummary),
      escapeCSV(createdDate),
      escapeCSV(t.description),
      escapeCSV(t.notes ?? ""),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `taskflow-${board.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}-${new Date().toISOString().slice(0, 10)}.csv`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
