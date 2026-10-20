import { useMemo } from "react";
import {
  Box,
  Card,
  Container,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutline";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { useTaskStore } from "../store";
import { STATUSES, STATUS_META, PRIORITIES, PRIORITY_META } from "../utils";

export default function AnalyticsPage() {
  const theme = useTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const accentColor = useTaskStore((s) => s.accentColor);

  const total = tasks.length;
  const doing = tasks.filter((t) => t.status === "doing").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  // Calculate current streak (consecutive days with completed tasks)
  const currentStreak = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.status === "done" && t.completedAt);
    if (completedTasks.length === 0) return 0;

    const completedDays = new Set<string>();
    for (const t of completedTasks) {
      if (t.completedAt) {
        const d = new Date(t.completedAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        completedDays.add(`${yyyy}-${mm}-${dd}`);
      }
    }

    const today = new Date();
    const toKey = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    let streak = 0;
    const checkDate = new Date(today);

    // If no tasks completed today, check if yesterday had one to maintain streak
    const todayKey = toKey(checkDate);
    if (!completedDays.has(todayKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayKey = toKey(checkDate);
      if (!completedDays.has(yesterdayKey)) {
        return 0;
      }
    }

    while (true) {
      const key = toKey(checkDate);
      if (completedDays.has(key)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [tasks]);

  // Last 14 days completed tasks activity data for AreaChart
  const last14DaysData = useMemo(() => {
    const data: { date: string; fullDate: string; completed: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      const shortLabel = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

      const count = tasks.filter((t) => {
        if (t.status !== "done" || !t.completedAt) return false;
        const taskDate = new Date(t.completedAt);
        const taskKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, "0")}-${String(taskDate.getDate()).padStart(2, "0")}`;
        return taskKey === key;
      }).length;

      data.push({ date: shortLabel, fullDate: key, completed: count });
    }

    return data;
  }, [tasks]);

  // Tasks by status data for Donut Chart
  const statusData = useMemo(() => {
    return STATUSES.map((s) => ({
      name: STATUS_META[s].label,
      value: tasks.filter((t) => t.status === s).length,
      color: STATUS_META[s].color,
    }));
  }, [tasks]);

  // Tasks by priority data for Bar Chart
  const priorityData = useMemo(() => {
    return PRIORITIES.map((p) => ({
      name: PRIORITY_META[p].label,
      count: tasks.filter((t) => t.priority === p).length,
      color: PRIORITY_META[p].color,
    }));
  }, [tasks]);

  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" fontWeight={700}>
          Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track workflow velocity, completion metrics, and status distribution across your workspace.
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          mb: 4,
        }}
      >
        {/* Completion Rate */}
        <Paper variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha("#2E9E6B", 0.14),
              color: "#2E9E6B",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CheckCircleIcon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>
              {completionRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
          </Box>
        </Paper>

        {/* Current Streak */}
        <Paper variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha("#D97706", 0.14),
              color: "#D97706",
              display: "grid",
              placeItems: "center",
            }}
          >
            <LocalFireDepartmentIcon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>
              {currentStreak} {currentStreak === 1 ? "day" : "days"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Streak
            </Typography>
          </Box>
        </Paper>

        {/* Completed Tasks */}
        <Paper variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha(accentColor, 0.14),
              color: accentColor,
              display: "grid",
              placeItems: "center",
            }}
          >
            <TaskAltIcon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>
              {done}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasks Completed
            </Typography>
          </Box>
        </Paper>

        {/* In Progress */}
        <Paper variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: alpha("#7A5AF8", 0.14),
              color: "#7A5AF8",
              display: "grid",
              placeItems: "center",
            }}
          >
            <PlayCircleOutlineIcon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.1 }}>
              {doing}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Main Charts Grid */}
      <Stack spacing={3}>
        {/* 14 Days Area Chart */}
        <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            Tasks Completed (Last 14 Days)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Daily throughput based on completed task timestamps.
          </Typography>

          <Box sx={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14DaysData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme.palette.divider}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={{ stroke: theme.palette.divider }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    borderColor: theme.palette.divider,
                    borderRadius: 8,
                    fontSize: 13,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed Tasks"
                  stroke={accentColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#completedArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Donut Chart & Bar Chart Grid */}
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {/* Donut Chart: Tasks by Status */}
          <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Tasks by Status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current workflow state distribution.
            </Typography>

            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val: string) => (
                      <span style={{ color: theme.palette.text.primary, fontSize: 13 }}>{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Bar Chart: Tasks by Priority */}
          <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Tasks by Priority
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              High, medium, and low urgency breakdown.
            </Typography>

            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.palette.divider}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>
      </Stack>
    </Container>
  );
}
