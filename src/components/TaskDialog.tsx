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
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Label, Status, Task, TaskInput } from "../types";
import { PRIORITIES, STATUSES } from "../utils";
import { useTaskStore } from "../store";

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
  });

type TaskFormData = {
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  estimatedTime?: string;
  notes?: string;
  labels: Label[];
  subtasks: { id: string; title: string; completed: boolean }[];
};

interface Props {
  open: boolean;
  task: Task | null;
  defaultStatus: Status;
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

export default function TaskDialog({ open, task, defaultStatus, onClose, onSave }: Props) {
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
    },
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control,
    name: "subtasks",
  });

  const selectedLabels = watch("labels");

  useEffect(() => {
    if (!open) return;
    reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? defaultStatus,
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate ?? "",
      estimatedTime: task?.estimatedTime ?? "",
      notes: task?.notes ?? "",
      labels: task?.labels ?? [],
      subtasks: task?.subtasks ?? [],
    });
    setNewSubtaskTitle("");
    setShowNewLabelForm(false);
    setNewLabelName("");
  }, [open, task, defaultStatus, reset]);

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
                  autoFocus
                  required
                  fullWidth
                  label={t("task.title")}
                  placeholder={t("task.titlePlaceholder")}
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message ?? " "}
                  sx={{ "& .MuiFormHelperText-root": { mt: 0.5 } }}
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
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  label={t("task.description")}
                  placeholder={t("task.descPlaceholder")}
                />
              )}
            />

            {/* Status, Priority, Due date */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label={t("task.status")} {...field}>
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
                  <TextField select fullWidth label={t("task.priority")} {...field}>
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
                    type="date"
                    fullWidth
                    label={t("task.dueDate")}
                    value={field.value ?? ""}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Stack>

            {/* Estimated time */}
            <Controller
              name="estimatedTime"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
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
                      size="small"
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
                  size="small"
                  fullWidth
                  placeholder={t("task.addSubtaskPlaceholder")}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
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
