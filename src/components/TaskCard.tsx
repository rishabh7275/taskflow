import { useState, type MouseEvent, type ReactNode } from "react";
import {
  Box,
  Card,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EventIcon from "@mui/icons-material/EventOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Status, Task } from "../types";
import { PRIORITY_META, STATUSES, STATUS_META, formatDue, isOverdue } from "../utils";
import { useTaskStore } from "../store";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (id: string, status: Status) => void;
  isOverlay?: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, onMove, isOverlay = false }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const selectedTaskIds = useTaskStore((s) => s.selectedTaskIds);
  const toggleSelectTask = useTaskStore((s) => s.toggleSelectTask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);

  const isSelected = selectedTaskIds.includes(task.id);
  const priority = PRIORITY_META[task.priority];
  const overdue = isOverdue(task);
  const done = task.status === "done";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : done ? 0.75 : 1,
  };

  const closeMenu = () => setAnchor(null);

  const totalSubtasks = task.subtasks?.length ?? 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;
  const subtaskProgress =
    totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  const menuItems: ReactNode[] = [
    <MenuItem
      key="edit"
      onClick={() => {
        closeMenu();
        onEdit(task);
      }}
    >
      <ListItemIcon>
        <EditIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Edit</ListItemText>
    </MenuItem>,
    ...STATUSES.filter((s) => s !== task.status).map((s) => (
      <MenuItem
        key={s}
        onClick={() => {
          closeMenu();
          onMove(task.id, s);
        }}
      >
        <ListItemIcon>
          <ArrowForwardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Move to {STATUS_META[s].label}</ListItemText>
      </MenuItem>
    )),
    <Divider key="divider" />,
    <MenuItem
      key="delete"
      onClick={() => {
        closeMenu();
        onDelete(task);
      }}
      sx={{ color: "error.main" }}
    >
      <ListItemIcon sx={{ color: "inherit" }}>
        <DeleteIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Delete</ListItemText>
    </MenuItem>,
  ];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="outlined"
      {...attributes}
      {...listeners}
      sx={{
        p: 1.5,
        pl: 2,
        borderLeft: `4px solid ${priority.color}`,
        cursor: isOverlay ? "grabbing" : "grab",
        bgcolor: isSelected
          ? (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.08 : 0.16)
          : "background.paper",
        borderColor: isSelected ? "primary.main" : "divider",
        boxShadow: isOverlay
          ? "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)"
          : undefined,
        "&:active": { cursor: "grabbing" },
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Top Header: Checkbox + Title + More Menu */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelectTask(task.id);
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Select ${task.title}`}
          sx={{ p: 0.25, mt: -0.25, mr: 0.5 }}
        />

        <Typography
          variant="subtitle1"
          sx={{
            flex: 1,
            fontWeight: 600,
            lineHeight: 1.3,
            textDecoration: done ? "line-through" : "none",
            wordBreak: "break-word",
          }}
        >
          {task.title}
        </Typography>

        <IconButton
          size="small"
          aria-label={`Actions for ${task.title}`}
          onClick={(e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            setAnchor(e.currentTarget);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          sx={{ mt: -0.5, mr: -0.5 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Description */}
      {task.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.75,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {task.description}
        </Typography>
      )}

      {/* Labels / Tags */}
      {task.labels && task.labels.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
          {task.labels.map((lbl) => (
            <Chip
              key={lbl.id}
              size="small"
              label={lbl.name}
              sx={{
                height: 20,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: alpha(lbl.color, 0.14),
                color: lbl.color,
                border: "1px solid",
                borderColor: alpha(lbl.color, 0.3),
              }}
            />
          ))}
        </Box>
      )}

      {/* Subtasks Progress Bar & Checklist */}
      {totalSubtasks > 0 && (
        <Box
          sx={{ mt: 1.5 }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              py: 0.25,
            }}
            onClick={() => setShowSubtasks((prev) => !prev)}
          >
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Subtasks: {completedSubtasks}/{totalSubtasks} ({subtaskProgress}%)
            </Typography>
            <IconButton size="small" sx={{ p: 0.25 }}>
              {showSubtasks ? (
                <KeyboardArrowUpIcon fontSize="inherit" />
              ) : (
                <KeyboardArrowDownIcon fontSize="inherit" />
              )}
            </IconButton>
          </Box>
          <LinearProgress
            variant="determinate"
            value={subtaskProgress}
            sx={{
              height: 5,
              borderRadius: 3,
              mt: 0.25,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            }}
          />

          <Collapse in={showSubtasks} timeout="auto" unmountOnExit>
            <Stack spacing={0.5} sx={{ mt: 1, pl: 0.5 }}>
              {task.subtasks.map((sub) => (
                <Box
                  key={sub.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSubtask(task.id, sub.id)}
                >
                  {sub.completed ? (
                    <CheckBoxIcon fontSize="small" color="primary" />
                  ) : (
                    <CheckBoxOutlineBlankIcon fontSize="small" color="action" />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      textDecoration: sub.completed ? "line-through" : "none",
                      color: sub.completed ? "text.secondary" : "text.primary",
                    }}
                  >
                    {sub.title}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* Metadata Chips: Priority, Due Date, Estimated Time, Notes */}
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ mt: 1.5 }}>
        <Chip
          size="small"
          label={priority.label}
          sx={{ color: priority.color, bgcolor: alpha(priority.color, 0.14), fontWeight: 700 }}
        />
        {task.dueDate && (
          <Chip
            size="small"
            icon={<EventIcon />}
            label={overdue ? `Overdue · ${formatDue(task.dueDate)}` : formatDue(task.dueDate)}
            color={overdue ? "error" : "default"}
            variant={overdue ? "filled" : "outlined"}
          />
        )}
        {task.estimatedTime && (
          <Chip
            size="small"
            icon={<AccessTimeIcon />}
            label={task.estimatedTime}
            variant="outlined"
            sx={{ fontSize: 12 }}
          />
        )}
        {task.notes && (
          <Tooltip title={task.notes} arrow>
            <Chip
              size="small"
              icon={<StickyNote2OutlinedIcon />}
              label="Notes"
              variant="outlined"
              sx={{ fontSize: 12 }}
            />
          </Tooltip>
        )}
      </Stack>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        {menuItems}
      </Menu>
    </Card>
  );
}
