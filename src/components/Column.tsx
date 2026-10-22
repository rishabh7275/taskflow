import { useTranslation } from "react-i18next";
import { Box, IconButton, Stack, Typography, alpha } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import type { Status, Task } from "../types";
import { STATUS_META } from "../utils";
import TaskCard from "./TaskCard";

interface Props {
  status: Status;
  tasks: Task[];
  isFiltering: boolean;
  onMove: (id: string, status: Status) => void;
  onAdd: (status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function Column({
  status,
  tasks,
  isFiltering,
  onMove,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const meta = STATUS_META[status];
  const statusLabel = t(`status.${status}`);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <Box
      ref={setNodeRef}
      component="section"
      aria-label={statusLabel}
      sx={{
        p: 1.5,
        borderRadius: 4,
        minHeight: 320,
        border: "1px solid",
        borderColor: isOver ? meta.color : alpha(meta.color, 0.25),
        bgcolor: (t) =>
          alpha(meta.color, isOver ? 0.16 : t.palette.mode === "light" ? 0.07 : 0.1),
        transition: "all 150ms ease",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, px: 0.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: meta.color }} />
        <Typography variant="subtitle1" component="h2" sx={{ flex: 1, fontWeight: 700 }}>
          {statusLabel}
        </Typography>
        <Box
          aria-label={t("column.taskCount", { count: tasks.length })}
          sx={{
            minWidth: 26,
            px: 1,
            py: 0.25,
            borderRadius: 4,
            textAlign: "center",
            fontSize: 13,
            fontWeight: 700,
            color: meta.color,
            bgcolor: alpha(meta.color, 0.16),
          }}
        >
          {tasks.length}
        </Box>
        <IconButton
          size="small"
          aria-label={t("column.addTask", { status: statusLabel })}
          onClick={() => onAdd(status)}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <Stack spacing={1.5} sx={{ minHeight: 80 }}>
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
              />
            ))}
          </AnimatePresence>
        </Stack>
      </SortableContext>

      {tasks.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 1, py: 4, textAlign: "center" }}
        >
          {isFiltering ? t("column.filterEmptyMessage") : t(`status.${status}Empty`)}
        </Typography>
      )}
    </Box>
  );
}
