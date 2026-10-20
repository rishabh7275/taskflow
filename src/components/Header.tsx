import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputBase,
  Tooltip,
  Typography,
  alpha,
  type PaletteMode,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardCommandKeyIcon from "@mui/icons-material/KeyboardCommandKey";
import { useTaskStore } from "../store";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  mode: PaletteMode;
  onToggleMode: () => void;
  onNewTask: () => void;
  onToggleNav?: () => void;
}

export default function Header({
  query,
  onQueryChange,
  mode,
  onToggleMode,
  onNewTask,
  onToggleNav,
}: Props) {
  const setCommandPaletteOpen = useTaskStore((s) => s.setCommandPaletteOpen);

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderBottom: 1,
        borderColor: "divider",
        backdropFilter: "blur(12px)",
        bgcolor: (t) => alpha(t.palette.background.default, 0.85),
      }}
    >
      <Container
        maxWidth="xl"
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, py: 1.5 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: "auto" }}>
          {onToggleNav && (
            <IconButton
              onClick={onToggleNav}
              aria-label="Open navigation"
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "grid",
              placeItems: "center",
            }}
          >
            <TaskAltIcon />
          </Box>
          <Box>
            <Typography variant="h6" component="h1" sx={{ lineHeight: 1.1 }}>
              TaskFlow
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Plan. Track. Finish.
            </Typography>
          </Box>
        </Box>

        {/* Search input with ⌘K badge */}
        <Box
          sx={{
            order: { xs: 3, sm: 0 },
            flexBasis: { xs: "100%", sm: 340 },
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            height: 42,
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            "&:focus-within": {
              borderColor: "primary.main",
              boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.2)}`,
            },
          }}
        >
          <SearchIcon fontSize="small" color="action" />
          <InputBase
            id="search-tasks-input"
            fullWidth
            placeholder="Search tasks (/ to focus)"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            inputProps={{ "aria-label": "Search tasks" }}
          />
          <Tooltip title="Command Palette (⌘K / Ctrl+K)">
            <Chip
              size="small"
              icon={<KeyboardCommandKeyIcon sx={{ fontSize: "14px !important" }} />}
              label="K"
              onClick={() => setCommandPaletteOpen(true)}
              sx={{
                height: 22,
                cursor: "pointer",
                borderRadius: 1.5,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: (t) => alpha(t.palette.action.selected, 0.8),
              }}
            />
          </Tooltip>
        </Box>

        <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton onClick={onToggleMode} aria-label="Toggle colour mode">
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewTask}
          sx={{ height: 42 }}
        >
          New task
        </Button>
      </Container>
    </Box>
  );
}
