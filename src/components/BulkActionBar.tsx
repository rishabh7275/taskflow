import { useState, type MouseEvent } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FlagIcon from "@mui/icons-material/FlagOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import { useTaskStore } from "../store";
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from "../utils";
import type { Priority, Status } from "../types";

export default function BulkActionBar() {
  const selectedTaskIds = useTaskStore((s) => s.selectedTaskIds);
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const bulkMove = useTaskStore((s) => s.bulkMove);
  const bulkSetPriority = useTaskStore((s) => s.bulkSetPriority);
  const bulkDelete = useTaskStore((s) => s.bulkDelete);

  const [moveAnchor, setMoveAnchor] = useState<HTMLElement | null>(null);
  const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(null);

  const openMoveMenu = (e: MouseEvent<HTMLElement>) => setMoveAnchor(e.currentTarget);
  const closeMoveMenu = () => setMoveAnchor(null);

  const openPriorityMenu = (e: MouseEvent<HTMLElement>) => setPriorityAnchor(e.currentTarget);
  const closePriorityMenu = () => setPriorityAnchor(null);

  const handleBulkMove = (status: Status) => {
    bulkMove(status);
    closeMoveMenu();
  };

  const handleBulkPriority = (p: Priority) => {
    bulkSetPriority(p);
    closePriorityMenu();
  };

  const isVisible = selectedTaskIds.length > 0;

  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: (t) => t.zIndex.snackbar + 1,
          px: 2.5,
          py: 1.25,
          borderRadius: 4,
          border: 1,
          borderColor: "divider",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          boxShadow: (t) =>
            t.palette.mode === "light"
              ? "0 10px 30px rgba(15,23,42,0.15)"
              : "0 14px 34px rgba(0,0,0,0.5)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label={selectedTaskIds.length}
            color="primary"
            sx={{ fontWeight: 700 }}
          />
          <Typography variant="body2" fontWeight={600}>
            selected
          </Typography>
        </Stack>

        <Box sx={{ height: 24, width: "1px", bgcolor: "divider" }} />

        {/* Move to Menu */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<ArrowForwardIcon fontSize="small" />}
          onClick={openMoveMenu}
        >
          Move to
        </Button>
        <Menu anchorEl={moveAnchor} open={Boolean(moveAnchor)} onClose={closeMoveMenu}>
          {STATUSES.map((s) => (
            <MenuItem key={s} onClick={() => handleBulkMove(s)}>
              <ListItemIcon>
                <ArrowForwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Move to {STATUS_META[s].label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>

        {/* Priority Menu */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<FlagIcon fontSize="small" />}
          onClick={openPriorityMenu}
        >
          Priority
        </Button>
        <Menu anchorEl={priorityAnchor} open={Boolean(priorityAnchor)} onClose={closePriorityMenu}>
          {PRIORITIES.map((p) => (
            <MenuItem key={p} onClick={() => handleBulkPriority(p)}>
              <ListItemText sx={{ color: PRIORITY_META[p].color, fontWeight: 600 }}>
                {PRIORITY_META[p].label}
              </ListItemText>
            </MenuItem>
          ))}
        </Menu>

        {/* Delete */}
        <Button
          size="small"
          variant="contained"
          color="error"
          startIcon={<DeleteOutlineIcon fontSize="small" />}
          onClick={bulkDelete}
        >
          Delete
        </Button>

        {/* Clear selection */}
        <IconButton size="small" onClick={clearSelection} aria-label="Clear selection">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
}
