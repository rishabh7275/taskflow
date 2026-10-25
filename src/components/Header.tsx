import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import { useTaskStore, clearInMemoryData } from "../store";
import { useAuth } from "../hooks";

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
  const { t } = useTranslation();
  const setCommandPaletteOpen = useTaskStore((s) => s.setCommandPaletteOpen);
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    try {
      await logout();
    } catch (err) {
      console.error("TaskFlow: Error during logout", err);
    }
    clearInMemoryData();
    navigate("/login", { replace: true });
  };

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (tTheme) => tTheme.zIndex.appBar,
        borderBottom: 1,
        borderColor: "divider",
        backdropFilter: "blur(12px)",
        bgcolor: (tTheme) => alpha(tTheme.palette.background.default, 0.85),
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
              aria-label={t("header.openNav")}
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
              {t("common.appName")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("common.tagline")}
            </Typography>
          </Box>
        </Box>

        {/* Search input with ⌘K badge */}
        <Box
          sx={{
            order: { xs: 3, sm: 0 },
            flexBasis: { xs: "100%", sm: 300, md: 340 },
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
              boxShadow: (tTheme) => `0 0 0 3px ${alpha(tTheme.palette.primary.main, 0.2)}`,
            },
          }}
        >
          <SearchIcon fontSize="small" color="action" />
          <InputBase
            id="search-tasks-input"
            name="search"
            fullWidth
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            inputProps={{
              id: "search-tasks-input",
              name: "search",
              "aria-label": t("search.ariaLabel"),
            }}
          />
          <Tooltip title={t("header.commandPaletteTooltip")}>
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
                bgcolor: (tTheme) => alpha(tTheme.palette.action.selected, 0.8),
              }}
            />
          </Tooltip>
        </Box>

        {/* Small Saving / Saved Indicator */}
        <Tooltip
          title={
            syncStatus === "saving"
              ? t("header.syncSavingTooltip")
              : syncStatus === "saved"
              ? t("header.syncSavedTooltip")
              : syncStatus === "error"
              ? t("header.syncErrorTooltip")
              : t("header.syncReadyTooltip")
          }
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.6,
              borderRadius: 2,
              bgcolor: (tTheme) =>
                syncStatus === "saving"
                  ? alpha(tTheme.palette.primary.main, 0.08)
                  : syncStatus === "error"
                  ? alpha(tTheme.palette.warning.main, 0.12)
                  : alpha(tTheme.palette.action.hover, 0.35),
              border: 1,
              borderColor: "divider",
            }}
          >
            {syncStatus === "saving" && (
              <>
                <CircularProgress size={12} thickness={5} color="primary" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: "primary.main" }}>
                  {t("header.syncSaving")}
                </Typography>
              </>
            )}
            {syncStatus === "saved" && (
              <>
                <CloudDoneOutlinedIcon sx={{ fontSize: 16, color: "success.main" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  {t("header.syncSaved")}
                </Typography>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <CloudOffOutlinedIcon sx={{ fontSize: 16, color: "warning.main" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: "warning.main" }}>
                  {t("header.syncOffline")}
                </Typography>
              </>
            )}
            {syncStatus === "idle" && (
              <>
                <CloudDoneOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                <Typography variant="caption" sx={{ fontWeight: 500, color: "text.secondary" }}>
                  {t("header.syncSaved")}
                </Typography>
              </>
            )}
          </Box>
        </Tooltip>

        <Tooltip title={mode === "dark" ? t("header.switchToLight") : t("header.switchToDark")}>
          <IconButton onClick={onToggleMode} aria-label={t("header.toggleThemeAria")}>
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewTask}
          sx={{ height: 42 }}
        >
          {t("task.newTask")}
        </Button>

        {/* User Account Menu */}
        {user && (
          <>
            <Tooltip title={t("header.userMenuAria")}>
              <ButtonBase
                onClick={handleOpenUserMenu}
                aria-label={t("header.userMenuAria")}
                aria-controls={Boolean(anchorEl) ? "header-user-menu" : undefined}
                aria-haspopup="true"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  py: 0.5,
                  px: 1,
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: (tTheme) => alpha(tTheme.palette.action.hover, 0.5),
                    borderColor: "primary.main",
                  },
                }}
              >
                <Avatar
                  src={user.photoURL ?? undefined}
                  alt={user.displayName ?? user.email ?? "User"}
                  sx={{
                    width: 30,
                    height: 30,
                    fontSize: 13,
                    fontWeight: 700,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }}
                >
                  {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    maxWidth: { xs: 80, sm: 120, md: 160 },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "text.primary",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {user.displayName || user.email}
                </Typography>
                <KeyboardArrowDownIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </ButtonBase>
            </Tooltip>

            <Menu
              id="header-user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseUserMenu}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 4,
                sx: {
                  minWidth: 230,
                  mt: 1,
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                  p: 0.5,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {user.displayName || t("header.account")}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {user.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  color: "error.main",
                  "&:hover": {
                    bgcolor: (tTheme) => alpha(tTheme.palette.error.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={t("header.logout")}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                />
              </MenuItem>
            </Menu>
          </>
        )}
      </Container>
    </Box>
  );
}
