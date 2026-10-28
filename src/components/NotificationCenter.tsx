import { useState, type MouseEvent } from "react";
import {
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store";
import type { AppNotification } from "../types";

function formatNotificationTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const theme = useTheme();

  const notifications = useTaskStore((s) => s.notifications);
  const tasks = useTaskStore((s) => s.tasks);
  const markNotificationRead = useTaskStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useTaskStore((s) => s.markAllNotificationsRead);
  const clearNotification = useTaskStore((s) => s.clearNotification);
  const clearAllNotifications = useTaskStore((s) => s.clearAllNotifications);
  const openEditTask = useTaskStore((s) => s.openEditTask);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (notification: AppNotification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
    if (notification.taskId) {
      const task = tasks.find((t) => t.id === notification.taskId);
      if (task) {
        openEditTask(task);
        handleClose();
      }
    }
  };

  const renderTypeIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "overdue":
        return (
          <Box
            sx={{
              p: 0.75,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.error.main, 0.12),
              color: "error.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningAmberRoundedIcon fontSize="small" />
          </Box>
        );
      case "due_today":
        return (
          <Box
            sx={{
              p: 0.75,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.warning.main, 0.14),
              color: "warning.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TodayRoundedIcon fontSize="small" />
          </Box>
        );
      case "upcoming":
        return (
          <Box
            sx={{
              p: 0.75,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.info.main, 0.12),
              color: "info.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ScheduleRoundedIcon fontSize="small" />
          </Box>
        );
      default:
        return (
          <Box
            sx={{
              p: 0.75,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </Box>
        );
    }
  };

  return (
    <>
      <Tooltip title={t("notifications.title", "Notifications")}>
        <IconButton
          id="notification-bell-btn"
          aria-label={t("notifications.ariaLabel", "View notifications")}
          aria-controls={open ? "notification-popover" : undefined}
          aria-haspopup="true"
          onClick={handleOpen}
          sx={{
            color: unreadCount > 0 ? "primary.main" : "text.secondary",
            transition: "all 0.2s ease",
            "&:hover": {
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                fontWeight: 700,
                fontSize: 10,
                height: 18,
                minWidth: 18,
                px: 0.5,
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsActiveOutlinedIcon />
            ) : (
              <NotificationsOutlinedIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        id="notification-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: { xs: 320, sm: 380, md: 420 },
              maxWidth: "calc(100vw - 32px)",
              maxHeight: 520,
              display: "flex",
              flexDirection: "column",
              borderRadius: 3,
              boxShadow: (th) =>
                th.palette.mode === "dark"
                  ? "0 12px 32px rgba(0,0,0,0.6)"
                  : "0 12px 32px rgba(15,23,42,0.12)",
              border: 1,
              borderColor: "divider",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: (th) => alpha(th.palette.background.paper, 0.8),
            backdropFilter: "blur(8px)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              {t("notifications.title", "Notifications")}
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} ${t("notifications.new", "new")}`}
                size="small"
                color="error"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={0.5}>
            {unreadCount > 0 && (
              <Tooltip title={t("notifications.markAllRead", "Mark all as read")}>
                <IconButton
                  size="small"
                  onClick={markAllNotificationsRead}
                  aria-label={t("notifications.markAllRead", "Mark all as read")}
                  sx={{ color: "text.secondary" }}
                >
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {notifications.length > 0 && (
              <Tooltip title={t("notifications.clearAll", "Clear all")}>
                <IconButton
                  size="small"
                  onClick={clearAllNotifications}
                  aria-label={t("notifications.clearAll", "Clear all")}
                  sx={{ color: "text.secondary" }}
                >
                  <DeleteSweepOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Content List */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
          {notifications.length === 0 ? (
            <Box
              sx={{
                py: 6,
                px: 3,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: (th) => alpha(th.palette.action.hover, 0.5),
                  color: "text.secondary",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <NotificationsNoneOutlinedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {t("notifications.emptyTitle", "All caught up!")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 260 }}>
                {t(
                  "notifications.emptyDesc",
                  "You have no pending deadline reminders or notifications."
                )}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((notification, idx) => (
                <Box key={notification.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: 1 }}>
                        {!notification.read && (
                          <Tooltip title={t("notifications.markAsRead", "Mark as read")}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationRead(notification.id);
                              }}
                              aria-label={t("notifications.markAsRead", "Mark as read")}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "primary.main" },
                              }}
                            >
                              <CheckIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t("notifications.dismiss", "Dismiss")}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            aria-label={t("notifications.dismiss", "Dismiss")}
                            sx={{
                              color: "text.disabled",
                              "&:hover": { color: "error.main" },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                    sx={{
                      bgcolor: notification.read
                        ? "transparent"
                        : (th) => alpha(th.palette.primary.main, 0.04),
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleItemClick(notification)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        pr: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                        {renderTypeIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                            <Typography
                              variant="body2"
                              fontWeight={notification.read ? 600 : 700}
                              color="text.primary"
                              sx={{ lineHeight: 1.3 }}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Box
                                component="span"
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  bgcolor: "primary.main",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ lineHeight: 1.4 }}
                            >
                              {notification.message}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              sx={{ pt: 0.25 }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color: "text.disabled",
                                }}
                              >
                                {formatNotificationTime(notification.timestamp)}
                              </Typography>
                              {notification.taskId && (
                                <Chip
                                  label={t("notifications.viewTask", "View Task")}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    borderColor: "divider",
                                  }}
                                />
                              )}
                            </Stack>
                          </Stack>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
