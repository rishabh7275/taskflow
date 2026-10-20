import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import BarChartIcon from "@mui/icons-material/BarChartOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AddIcon from "@mui/icons-material/Add";
import ViewKanbanIcon from "@mui/icons-material/ViewKanbanOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import KeyboardIcon from "@mui/icons-material/KeyboardOutlined";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import TaskDialog from "./TaskDialog";
import CommandPalette from "./CommandPalette";
import ShortcutsDialog from "./ShortcutsDialog";
import BoardModal from "./BoardModal";
import { useTaskStore } from "../store";
import type { Board } from "../types";

const SIDEBAR_WIDTH = 260;

const NAV_ITEMS = [
  { label: "Board", path: "/board", icon: DashboardIcon },
  { label: "Analytics", path: "/analytics", icon: BarChartIcon },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
];

export default function Layout({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [boardModal, setBoardModal] = useState<{ open: boolean; board: Board | null }>({
    open: false,
    board: null,
  });
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; board: Board } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const query = useTaskStore((s) => s.query);
  const setQuery = useTaskStore((s) => s.setQuery);
  const mode = useTaskStore((s) => s.mode);
  const toggleMode = useTaskStore((s) => s.toggleMode);
  const openNewTask = useTaskStore((s) => s.openNewTask);
  const dialog = useTaskStore((s) => s.dialog);
  const closeDialog = useTaskStore((s) => s.closeDialog);
  const saveTask = useTaskStore((s) => s.saveTask);
  const toast = useTaskStore((s) => s.toast);
  const setToast = useTaskStore((s) => s.setToast);
  const setShortcutsOpen = useTaskStore((s) => s.setShortcutsOpen);

  const boards = useTaskStore((s) => s.boards);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const setActiveBoardId = useTaskStore((s) => s.setActiveBoardId);
  const createBoard = useTaskStore((s) => s.createBoard);
  const renameBoard = useTaskStore((s) => s.renameBoard);
  const deleteBoard = useTaskStore((s) => s.deleteBoard);

  // Keyboard shortcuts: N, /, ? (ignoring input fields)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openNewTask();
      } else if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.getElementById("search-tasks-input");
        searchInput?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openNewTask, setShortcutsOpen]);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleSelectBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    if (location.pathname !== "/board") {
      navigate("/board");
    }
    setMobileOpen(false);
  };

  const handleSaveBoard = (name: string, description?: string) => {
    if (boardModal.board) {
      renameBoard(boardModal.board.id, name);
    } else {
      createBoard(name, description);
      if (location.pathname !== "/board") navigate("/board");
    }
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Brand */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "grid",
            placeItems: "center",
          }}
        >
          <TaskAltIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.1 }}>
            TaskFlow
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Workspace
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Primary Navigation */}
      <List sx={{ px: 1.5, py: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={active}
                sx={{
                  borderRadius: 2.5,
                  py: 1,
                  px: 1.5,
                  color: active ? "primary.main" : "text.secondary",
                  bgcolor: active
                    ? (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.08 : 0.16)
                    : "transparent",
                  "&.Mui-selected": {
                    bgcolor: (t) =>
                      alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.08 : 0.16),
                    "&:hover": {
                      bgcolor: (t) =>
                        alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.12 : 0.22),
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: active ? "primary.main" : "inherit",
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Boards Section */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Boards
        </Typography>
        <Tooltip title="Create new board">
          <IconButton
            size="small"
            onClick={() => setBoardModal({ open: true, board: null })}
            aria-label="Create new board"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <List sx={{ px: 1.5, flexGrow: 1, overflowY: "auto" }}>
        {boards.map((b) => {
          const active = b.id === activeBoardId;
          return (
            <ListItem
              key={b.id}
              disablePadding
              secondaryAction={
                <IconButton
                  size="small"
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAnchor({ element: e.currentTarget, board: b });
                  }}
                  aria-label={`Options for ${b.name}`}
                  sx={{ opacity: active ? 1 : 0.6 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              }
              sx={{ mb: 0.5 }}
            >
              <ListItemButton
                onClick={() => handleSelectBoard(b.id)}
                selected={active}
                sx={{
                  borderRadius: 2.5,
                  py: 0.75,
                  px: 1.5,
                  pr: 4,
                  color: active ? "primary.main" : "text.secondary",
                  bgcolor: active
                    ? (t) => alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.08 : 0.16)
                    : "transparent",
                  "&.Mui-selected": {
                    bgcolor: (t) =>
                      alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.08 : 0.16),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: active ? "primary.main" : "inherit" }}>
                  <ViewKanbanIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={b.name}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                    fontSize: 13.5,
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Footer Quick Shortcuts Button */}
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          size="small"
          startIcon={<KeyboardIcon fontSize="small" />}
          onClick={() => setShortcutsOpen(true)}
          sx={{
            justifyContent: "flex-start",
            color: "text.secondary",
            py: 1,
            px: 1.5,
            borderRadius: 2,
          }}
        >
          Shortcuts (?)
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: SIDEBAR_WIDTH },
          flexShrink: { md: 0 },
          display: { xs: "none", md: "block" },
        }}
      >
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            position: "fixed",
            top: 0,
            bottom: 0,
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            zIndex: (t) => t.zIndex.drawer,
          }}
        >
          {drawerContent}
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: SIDEBAR_WIDTH,
            bgcolor: "background.paper",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          query={query}
          onQueryChange={setQuery}
          mode={mode}
          onToggleMode={toggleMode}
          onNewTask={() => openNewTask()}
          onToggleNav={handleDrawerToggle}
        />

        <Box sx={{ flexGrow: 1, position: "relative" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeInOut" }}
              style={{ width: "100%", height: "100%" }}
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </Box>

        <TaskDialog
          open={dialog.open}
          task={dialog.task}
          defaultStatus={dialog.status}
          onClose={closeDialog}
          onSave={saveTask}
        />

        <BoardModal
          open={boardModal.open}
          board={boardModal.board}
          onClose={() => setBoardModal({ open: false, board: null })}
          onSave={handleSaveBoard}
        />

        <CommandPalette />
        <ShortcutsDialog />

        {/* Board Actions Menu (Rename, Delete) */}
        <Menu
          anchorEl={menuAnchor?.element}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              if (menuAnchor) {
                setBoardModal({ open: true, board: menuAnchor.board });
                setMenuAnchor(null);
              }
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem
            disabled={boards.length <= 1}
            onClick={() => {
              if (menuAnchor) {
                deleteBoard(menuAnchor.board.id);
                setMenuAnchor(null);
              }
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        <Snackbar
          open={toast !== null}
          autoHideDuration={4000}
          onClose={(_, reason) => reason !== "clickaway" && setToast(null)}
          message={toast?.message}
          action={
            toast?.undo ? (
              <Button
                color="secondary"
                size="small"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Undo
              </Button>
            ) : toast?.redo ? (
              <Button
                color="secondary"
                size="small"
                onClick={() => {
                  toast.redo?.();
                  setToast(null);
                }}
              >
                Redo
              </Button>
            ) : undefined
          }
        />
      </Box>
    </Box>
  );
}
