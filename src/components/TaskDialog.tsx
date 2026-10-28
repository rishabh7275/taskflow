import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LabelIcon from "@mui/icons-material/LabelOutlined";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import RepeatIcon from "@mui/icons-material/Repeat";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  Label,
  Priority,
  RecurrenceConfig,
  RecurrenceFrequency,
  Status,
  Subtask,
  Task,
  TaskInput,
} from "../types";
import { PRIORITIES, STATUSES } from "../utils";
import { useTaskStore } from "../store";
import { WEEKDAY_LABELS } from "../lib/recurrence";

const createLabelSchema = (t: TFunction) =>
  z.object({
    id: z.string(),
    name: z.string().min(1, t("validation.labelRequired")),
    color: z.string(),
  });

const createSubtaskSchema = (t: TFunction) =>
  z.object({
    id: z.string(),
    title: z.string().trim().min(1, t("validation.subtaskRequired")),
    completed: z.boolean(),
  });

const createRecurrenceSchema = () =>
  z.object({
    frequency: z.enum(["none", "daily", "weekly", "monthly"]),
    weekdays: z.array(z.number()).optional(),
    monthDay: z.number().min(1).max(31).optional(),
  });

const createTaskFormSchema = (t: TFunction) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(1, t("validation.titleRequired"))
      .max(120, t("validation.titleMaxLength")),
    description: z.string().default(""),
    status: z.enum(["todo", "doing", "done"]),
    priority: z.enum(["low", "medium", "high"]),
    dueDate: z.string().nullable().optional(),
    estimatedTime: z.string().optional(),
    notes: z.string().optional(),
    labels: z.array(createLabelSchema(t)).default([]),
    subtasks: z.array(createSubtaskSchema(t)).default([]),
    recurrence: createRecurrenceSchema(),
  });

type TaskFormData = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate?: string | null;
  estimatedTime?: string;
  notes?: string;
  labels: Label[];
  subtasks: Subtask[];
  recurrence: RecurrenceConfig;
};

interface Props {
  open: boolean;
  task: Task | null;
  defaultStatus: Status;
  initialDueDate?: string | null;
  onClose: () => void;
  onSave: (input: TaskInput, id?: string) => void;
}

const PRESET_COLORS = [
  "#4F46E5",
  "#2E9E6B",
  "#D98B00",
  "#D6453D",
  "#7A5AF8",
  "#EC4899",
  "#0284C7",
];

export default function TaskDialog({
  open,
  task,
  defaultStatus,
  initialDueDate,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const availableLabels = useTaskStore((s) => s.availableLabels);
  const addCustomLabel = useTaskStore((s) => s.addCustomLabel);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showNewLabelForm, setShowNewLabelForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  const taskFormSchema = useMemo(() => createTaskFormSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      dueDate: "",
      estimatedTime: "",
      notes: "",
      labels: [],
      subtasks: [],
      recurrence: {
        frequency: "none",
        weekdays: [],
        monthDay: undefined,
      },
    },
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control,
    name: "subtasks",
  });

  const selectedLabels = watch("labels");
  const watchedRecurrence = watch("recurrence");
  const frequency = watchedRecurrence?.frequency ?? "none";
  const selectedWeekdays = watchedRecurrence?.weekdays ?? [];

  useEffect(() => {
    if (!open) return;
    reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? defaultStatus,
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate ?? initialDueDate ?? "",
      estimatedTime: task?.estimatedTime ?? "",
      notes: task?.notes ?? "",
      labels: task?.labels ?? [],
      subtasks: task?.subtasks ?? [],
      recurrence: task?.recurrence ?? {
        frequency: "none",
        weekdays: [],
        monthDay: undefined,
      },
    });
    setNewSubtaskTitle("");
    setShowNewLabelForm(false);
    setNewLabelName("");
  }, [open, task, defaultStatus, initialDueDate, reset]);

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    appendSubtask({
      id: crypto.randomUUID(),
      title: trimmed,
      completed: false,
    });
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (index: number) => {
    const current = watch(`subtasks.${index}.completed`);
    setValue(`subtasks.${index}.completed`, !current);
  };

  const handleToggleLabel = (label: Label) => {
    const exists = selectedLabels.some((l) => l.id === label.id);
    if (exists) {
      setValue(
        "labels",
        selectedLabels.filter((l) => l.id !== label.id)
      );
    } else {
      setValue("labels", [...selectedLabels, label]);
    }
  };

  const handleCreateLabel = () => {
    const trimmed = newLabelName.trim();
    if (!trimmed) return;
    const newLbl: Label = {
      id: `lbl-${Date.now()}`,
      name: trimmed,
      color: newLabelColor,
    };
    addCustomLabel(newLbl);
    setValue("labels", [...selectedLabels, newLbl]);
    setNewLabelName("");
    setShowNewLabelForm(false);
  };

  const onSubmit = (data: TaskFormData) => {
    const recurrence =
      data.recurrence && data.recurrence.frequency !== "none"
        ? {
            frequency: data.recurrence.frequency,
            weekdays:
              data.recurrence.frequency === "weekly"
                ? data.recurrence.weekdays && data.recurrence.weekdays.length > 0
                  ? data.recurrence.weekdays
                  : [data.dueDate ? new Date(`${data.dueDate}T00:00:00`).getDay() : new Date().getDay()]
                : undefined,
            monthDay:
              data.recurrence.frequency === "monthly"
                ? data.recurrence.monthDay ||
                  (data.dueDate ? parseInt(data.dueDate.split("-")[2], 10) : new Date().getDate())
                : undefined,
          }
        : null;

    onSave(
      {
        title: data.title.trim(),
        description: data.description?.trim() ?? "",
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? data.dueDate : null,
        estimatedTime: data.estimatedTime?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        labels: data.labels ?? [],
        subtasks: data.subtasks ?? [],
        recurrence,
        recurringParentId: task?.recurringParentId ?? null,
        nextOccurrenceCreated: recurrence ? (task?.nextOccurrenceCreated ?? false) : false,
      },
      task?.id
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          {task ? t("task.editTask") : t("task.newTask")}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: "75vh" }}>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* Title */}
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="task-title-input"
                  name="title"
                  autoFocus
                  required
                  fullWidth
                  label={t("task.title")}
                  placeholder={t("task.titlePlaceholder")}
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message ?? " "}
                  sx={{ "& .MuiFormHelperText-root": { mt: 0.5 } }}
                  inputProps={{ id: "task-title-input", name: "title" }}
                  InputLabelProps={{ htmlFor: "task-title-input" }}
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="task-description-input"
                  name="description"
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  label={t("task.description")}
                  placeholder={t("task.descPlaceholder")}
                  inputProps={{ id: "task-description-input", name: "description" }}
                  InputLabelProps={{ htmlFor: "task-description-input" }}
                />
              )}
            />

            {/* Status, Priority, Due date */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="task-status-select"
                    name="status"
                    select
                    fullWidth
                    label={t("task.status")}
                    SelectProps={{
                      id: "task-status-select",
                      inputProps: { id: "task-status-select", name: "status" },
                    }}
                    InputLabelProps={{ htmlFor: "task-status-select" }}
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="task-priority-select"
                    name="priority"
                    select
                    fullWidth
                    label={t("task.priority")}
                    SelectProps={{
                      id: "task-priority-select",
                      inputProps: { id: "task-priority-select", name: "priority" },
                    }}
                    InputLabelProps={{ htmlFor: "task-priority-select" }}
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {t(`priority.${p}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="task-due-date-input"
                    name="dueDate"
                    type="date"
                    fullWidth
                    label={t("task.dueDate")}
                    value={field.value ?? ""}
                    slotProps={{
                      inputLabel: { shrink: true, htmlFor: "task-due-date-input" },
                      htmlInput: { id: "task-due-date-input", name: "dueDate" },
                    }}
                  />
                )}
              />
            </Stack>

            {/* Recurrence Settings */}
            <Stack
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: (th) => alpha(th.palette.action.hover, 0.4),
                border: 1,
                borderColor: "divider",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <RepeatIcon fontSize="small" color={frequency !== "none" ? "primary" : "action"} />
                <Typography variant="subtitle2" fontWeight={700}>
                  {t("recurrence.label", "Recurrence")}
                </Typography>
              </Stack>

              <Controller
                name="recurrence.frequency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="task-recurrence-frequency-select"
                    name="recurrenceFrequency"
                    select
                    fullWidth
                    size="small"
                    label={t("recurrence.label", "Recurrence")}
                    value={field.value || "none"}
                    onChange={(e) => {
                      const newFreq = e.target.value as RecurrenceFrequency;
                      field.onChange(newFreq);
                      if (
                        newFreq === "weekly" &&
                        (!watchedRecurrence?.weekdays || watchedRecurrence.weekdays.length === 0)
                      ) {
                        const currentDue = watch("dueDate");
                        const defaultDay = currentDue
                          ? new Date(`${currentDue}T00:00:00`).getDay()
                          : new Date().getDay();
                        setValue("recurrence.weekdays", [defaultDay]);
                      } else if (newFreq === "monthly" && !watchedRecurrence?.monthDay) {
                        const currentDue = watch("dueDate");
                        const defaultDay = currentDue
                          ? parseInt(currentDue.split("-")[2], 10)
                          : new Date().getDate();
                        setValue("recurrence.monthDay", defaultDay);
                      }
                    }}
                    SelectProps={{
                      id: "task-recurrence-frequency-select",
                      inputProps: {
                        id: "task-recurrence-frequency-select",
                        name: "recurrenceFrequency",
                      },
                    }}
                    InputLabelProps={{ htmlFor: "task-recurrence-frequency-select" }}
                  >
                    <MenuItem value="none">{t("recurrence.none", "Does not repeat")}</MenuItem>
                    <MenuItem value="daily">{t("recurrence.daily", "Daily")}</MenuItem>
                    <MenuItem value="weekly">{t("recurrence.weekly", "Weekly")}</MenuItem>
                    <MenuItem value="monthly">{t("recurrence.monthly", "Monthly")}</MenuItem>
                  </TextField>
                )}
              />

              {/* Weekly weekday picker */}
              {frequency === "weekly" && (
                <Box sx={{ pt: 0.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1, fontWeight: 600 }}
                  >
                    {t("recurrence.repeatOn", "Repeat on weekdays")}
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    value={selectedWeekdays}
                    onChange={(_, newDays: number[] | null) => {
                      setValue("recurrence.weekdays", newDays || []);
                    }}
                    aria-label="Repeat weekdays"
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}
                  >
                    {WEEKDAY_LABELS.map((w) => (
                      <ToggleButton
                        key={w.value}
                        value={w.value}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: "8px !important",
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        {w.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              )}

              {/* Monthly day picker */}
              {frequency === "monthly" && (
                <Box sx={{ pt: 0.5 }}>
                  <TextField
                    id="task-recurrence-monthday-input"
                    name="monthDay"
                    type="number"
                    size="small"
                    label={t("recurrence.dayOfMonth", "Day of the month (1–31)")}
                    value={
                      watchedRecurrence?.monthDay ??
                      (watch("dueDate")
                        ? parseInt(watch("dueDate")!.split("-")[2], 10)
                        : new Date().getDate())
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setValue("recurrence.monthDay", Math.min(31, Math.max(1, val)));
                      }
                    }}
                    inputProps={{
                      min: 1,
                      max: 31,
                      id: "task-recurrence-monthday-input",
                      name: "monthDay",
                    }}
                    InputLabelProps={{ htmlFor: "task-recurrence-monthday-input" }}
                    helperText={t(
                      "recurrence.monthlyClampNote",
                      "Safely adjusts to the last day for shorter months (e.g. Feb 28, Apr 30)."
                    )}
                    fullWidth
                  />
                </Box>
              )}
            </Stack>

            {/* Estimated time */}
            <Controller
              name="estimatedTime"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="task-estimated-time-input"
                  name="estimatedTime"
                  fullWidth
                  label={t("task.estimatedTime")}
                  placeholder={t("task.estTimePlaceholder")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ id: "task-estimated-time-input", name: "estimatedTime" }}
                  InputLabelProps={{ htmlFor: "task-estimated-time-input" }}
                  helperText={t("task.estTimeHelper")}
                />
              )}
            />

            <Divider />

            {/* Labels section */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LabelIcon fontSize="small" color="action" /> {t("task.labels")}
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setShowNewLabelForm((prev) => !prev)}
                >
                  {showNewLabelForm ? t("common.cancel") : t("task.newLabel")}
                </Button>
              </Box>

              {/* Inline Create New Label */}
              {showNewLabelForm && (
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 1 }}>
                    {t("task.createCustomLabel")}
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                    <TextField
                      id="task-new-label-input"
                      name="newLabelName"
                      size="small"
                      label={t("task.createCustomLabel")}
                      placeholder={t("task.labelNamePlaceholder")}
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateLabel();
                        }
                      }}
                      sx={{ flex: 1 }}
                      inputProps={{
                        id: "task-new-label-input",
                        name: "newLabelName",
                        "aria-label": t("task.createCustomLabel"),
                      }}
                      InputLabelProps={{ htmlFor: "task-new-label-input" }}
                    />
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {PRESET_COLORS.map((c) => (
                        <Box
                          key={c}
                          onClick={() => setNewLabelColor(c)}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: c,
                            cursor: "pointer",
                            border: 2,
                            borderColor: newLabelColor === c ? "text.primary" : "transparent",
                            boxShadow: newLabelColor === c ? 2 : 0,
                            transition: "all 120ms ease",
                          }}
                        />
                      ))}
                    </Stack>
                    <Button variant="contained" size="small" onClick={handleCreateLabel}>
                      {t("common.add")}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Available Labels Chips */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {availableLabels.map((lbl) => {
                  const isSelected = selectedLabels.some((l) => l.id === lbl.id);
                  return (
                    <Chip
                      key={lbl.id}
                      label={lbl.name}
                      onClick={() => handleToggleLabel(lbl)}
                      sx={{
                        bgcolor: isSelected ? lbl.color : alpha(lbl.color, 0.12),
                        color: isSelected ? "#FFFFFF" : lbl.color,
                        fontWeight: 600,
                        border: "1px solid",
                        borderColor: lbl.color,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isSelected ? lbl.color : alpha(lbl.color, 0.25),
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            <Divider />

            {/* Subtasks (Checklist) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                {t("task.subtasksCount", {
                  completed: subtaskFields.filter((_, i) => watch(`subtasks.${i}.completed`)).length,
                  total: subtaskFields.length,
                })}
              </Typography>

              <Stack spacing={1} sx={{ mb: 2 }}>
                {subtaskFields.map((field, idx) => {
                  const completed = watch(`subtasks.${idx}.completed`);
                  return (
                    <Box
                      key={field.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 2,
                        bgcolor: "background.default",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleToggleSubtask(idx)}
                        color={completed ? "primary" : "default"}
                      >
                        {completed ? (
                          <CheckBoxIcon fontSize="small" />
                        ) : (
                          <CheckBoxOutlineBlankIcon fontSize="small" />
                        )}
                      </IconButton>
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          textDecoration: completed ? "line-through" : "none",
                          color: completed ? "text.secondary" : "text.primary",
                        }}
                      >
                        {watch(`subtasks.${idx}.title`)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeSubtask(idx)}
                        aria-label={t("task.removeSubtask")}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>

              <Stack direction="row" spacing={1}>
                <TextField
                  id="task-new-subtask-input"
                  name="newSubtaskTitle"
                  size="small"
                  fullWidth
                  label={t("task.addSubtaskPlaceholder")}
                  placeholder={t("task.addSubtaskPlaceholder")}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  inputProps={{
                    id: "task-new-subtask-input",
                    name: "newSubtaskTitle",
                    "aria-label": t("task.addSubtaskPlaceholder"),
                  }}
                  InputLabelProps={{ htmlFor: "task-new-subtask-input" }}
                />
                <Button variant="outlined" size="small" onClick={handleAddSubtask} sx={{ px: 2 }}>
                  {t("common.add")}
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Notes field */}
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="task-notes-input"
                  name="notes"
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  label={t("task.notes")}
                  placeholder={t("task.notesPlaceholder")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                        <StickyNote2OutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ id: "task-notes-input", name: "notes" }}
                  InputLabelProps={{ htmlFor: "task-notes-input" }}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained">
            {task ? t("task.save") : t("task.add")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
