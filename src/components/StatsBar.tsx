import type { ElementType } from "react";
import { Box, LinearProgress, Paper, Typography, alpha } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutline";
import PlayCircleIcon from "@mui/icons-material/PlayCircleOutline";
import ErrorIcon from "@mui/icons-material/ErrorOutline";
import ListIcon from "@mui/icons-material/FormatListBulleted";
import type { Task } from "../types";
import { isOverdue } from "../utils";

interface Props {
  tasks: Task[];
}

function IconBadge({ icon: Icon, color }: { icon: ElementType; color: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 40,
        height: 40,
        borderRadius: 2.5,
        display: "grid",
        placeItems: "center",
        color,
        bgcolor: alpha(color, 0.14),
        flexShrink: 0,
      }}
    >
      <Icon fontSize="small" />
    </Box>
  );
}

function Stat({
  value,
  label,
  icon,
  color,
}: {
  value: string | number;
  label: string;
  icon: ElementType;
  color: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
      <IconBadge icon={icon} color={color} />
      <Box>
        <Typography variant="h5" component="p" sx={{ lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function StatsBar({ tasks }: Props) {
  const total = tasks.length;
  const doing = tasks.filter((t) => t.status === "doing").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(isOverdue).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.4fr 1fr 1fr 1fr" },
      }}
    >
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
          <IconBadge icon={CheckCircleIcon} color="#2E9E6B" />
          <Box>
            <Typography variant="h5" component="p" sx={{ lineHeight: 1.1 }}>
              {pct}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {done} of {total} completed
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          aria-label="Completion"
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Paper>
      <Stat value={doing} label="In progress" icon={PlayCircleIcon} color="#7A5AF8" />
      <Stat value={overdue} label="Overdue" icon={ErrorIcon} color="#D6453D" />
      <Stat value={total} label="Total tasks" icon={ListIcon} color="#4F46E5" />
    </Box>
  );
}
