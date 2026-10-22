import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Chip,
  Dialog,
  Divider,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import BarChartIcon from "@mui/icons-material/BarChartOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import AddIcon from "@mui/icons-material/Add";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import ViewKanbanIcon from "@mui/icons-material/ViewKanbanOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../store";
import { exportBoardAsJSON, exportTasksAsCSV } from "../lib/dataTools";

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  action: () => void;
}

export default function CommandPalette() {
  const { t } = useTranslation();
  const isOpen = useTaskStore((s) => s.isCommandPaletteOpen);
  const setOpen = useTaskStore((s) => s.setCommandPaletteOpen);
  const boards = useTaskStore((s) => s.boards);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const setActiveBoardId = useTaskStore((s) => s.setActiveBoardId);
  const tasks = useTaskStore((s) => s.tasks);
  const mode = useTaskStore((s) => s.mode);
  const toggleMode = useTaskStore((s) => s.toggleMode);
  const openNewTask = useTaskStore((s) => s.openNewTask);
  const openEditTask = useTaskStore((s) => s.openEditTask);
  const setShortcutsOpen = useTaskStore((s) => s.setShortcutsOpen);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();

  // Global Ctrl/Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  // Base command list
  const baseCommands: CommandItem[] = [
    {
      id: "nav-board",
      category: t("palette.catNavigation"),
      title: t("palette.goBoard"),
      subtitle: t("palette.goBoardDesc"),
      icon: <DashboardIcon fontSize="small" />,
      action: () => {
        navigate("/board");
        setOpen(false);
      },
    },
    {
      id: "nav-analytics",
      category: t("palette.catNavigation"),
      title: t("palette.goAnalytics"),
      subtitle: t("palette.goAnalyticsDesc"),
      icon: <BarChartIcon fontSize="small" />,
      action: () => {
        navigate("/analytics");
        setOpen(false);
      },
    },
    {
      id: "nav-settings",
      category: t("palette.catNavigation"),
      title: t("palette.goSettings"),
      subtitle: t("palette.goSettingsDesc"),
      icon: <SettingsIcon fontSize="small" />,
      action: () => {
        navigate("/settings");
        setOpen(false);
      },
    },
    {
      id: "act-new-task",
      category: t("palette.catActions"),
      title: t("palette.newTask"),
      subtitle: t("palette.newTaskDesc"),
      icon: <AddIcon fontSize="small" />,
      badge: "N",
      action: () => {
        setOpen(false);
        openNewTask();
      },
    },
    {
      id: "act-toggle-theme",
      category: t("palette.catActions"),
      title: t("palette.toggleTheme", { mode }),
      subtitle: t("palette.toggleThemeDesc"),
      icon: mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />,
      action: () => {
        toggleMode();
        setOpen(false);
      },
    },
    {
      id: "act-shortcuts",
      category: t("palette.catActions"),
      title: t("palette.shortcutsHelp"),
      subtitle: t("palette.shortcutsHelpDesc"),
      icon: <HelpOutlineIcon fontSize="small" />,
      badge: "?",
      action: () => {
        setOpen(false);
        setShortcutsOpen(true);
      },
    },
    {
      id: "act-export-json",
      category: t("palette.catActions"),
      title: t("palette.exportJson"),
      subtitle: t("palette.exportJsonDesc"),
      icon: <FileDownloadIcon fontSize="small" />,
      action: () => {
        if (activeBoard) exportBoardAsJSON(activeBoard, tasks);
        setOpen(false);
      },
    },
    {
      id: "act-export-csv",
      category: t("palette.catActions"),
      title: t("palette.exportCsv"),
      subtitle: t("palette.exportCsvDesc"),
      icon: <FileDownloadIcon fontSize="small" />,
      action: () => {
        if (activeBoard) exportTasksAsCSV(activeBoard, tasks);
        setOpen(false);
      },
    },
    ...boards.map((b) => ({
      id: `board-${b.id}`,
      category: t("palette.catBoards"),
      title: t("palette.switchToBoard", { name: b.name }),
      subtitle: b.id === activeBoardId ? t("palette.currentlyActive") : t("palette.switchBoardView"),
      icon: <ViewKanbanIcon fontSize="small" />,
      badge: b.id === activeBoardId ? t("palette.activeBadge") : undefined,
      action: () => {
        setActiveBoardId(b.id);
        navigate("/board");
        setOpen(false);
      },
    })),
  ];

  // Search matching tasks
  const q = query.trim().toLowerCase();
  const taskCommands: CommandItem[] =
    q.length > 0
      ? tasks
          .filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.labels.some((l) => l.name.toLowerCase().includes(q))
          )
          .slice(0, 5)
          .map((item) => ({
            id: `task-${item.id}`,
            category: t("palette.catTasks"),
            title: item.title,
            subtitle: `${t(`status.${item.status}`)} · ${t(`priority.${item.priority}`)} ${t("palette.priorityLabel")}`,
            icon: <TaskAltIcon fontSize="small" />,
            action: () => {
              setActiveBoardId(item.boardId);
              navigate("/board");
              setOpen(false);
              openEditTask(item);
            },
          }))
      : [];

  const allFiltered = [...baseCommands, ...taskCommands].filter((item) => {
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allFiltered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allFiltered.length || 1)) % (allFiltered.length || 1));
    } else if (e.key === "Enter" && allFiltered[selectedIndex]) {
      e.preventDefault();
      allFiltered[selectedIndex].action();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          top: "-10%",
          boxShadow: (t) =>
            t.palette.mode === "light"
              ? "0 20px 40px rgba(0,0,0,0.18)"
              : "0 24px 50px rgba(0,0,0,0.6)",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: 1, borderColor: "divider" }}>
        <SearchIcon color="action" />
        <InputBase
          autoFocus
          fullWidth
          placeholder={t("palette.placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          sx={{ fontSize: 16 }}
        />
        <Chip
          size="small"
          label="ESC"
          onClick={() => setOpen(false)}
          sx={{ fontSize: 11, fontWeight: 700, borderRadius: 1.5, cursor: "pointer" }}
        />
      </Box>

      <List
        sx={{
          maxHeight: 380,
          overflowY: "auto",
          py: 1,
          px: 1,
        }}
      >
        {allFiltered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            {t("palette.empty")}
          </Typography>
        ) : (
          allFiltered.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    px: 1.5,
                    bgcolor: isSelected
                      ? (tTheme) => alpha(tTheme.palette.primary.main, tTheme.palette.mode === "light" ? 0.08 : 0.16)
                      : "transparent",
                    "&.Mui-selected": {
                      bgcolor: (tTheme) =>
                        alpha(tTheme.palette.primary.main, tTheme.palette.mode === "light" ? 0.08 : 0.16),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isSelected ? "primary.main" : "inherit" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={item.subtitle}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                    secondaryTypographyProps={{ fontSize: 12 }}
                  />
                  {item.badge && (
                    <Chip
                      size="small"
                      label={item.badge}
                      variant="outlined"
                      sx={{ fontSize: 11, height: 20, fontWeight: 600 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })
        )}
      </List>

      <Divider />
      <Paper
        elevation={0}
        sx={{
          py: 1,
          px: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "background.default",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t("palette.footerNav")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("palette.footerBrand")}
        </Typography>
      </Paper>
    </Dialog>
  );
}
