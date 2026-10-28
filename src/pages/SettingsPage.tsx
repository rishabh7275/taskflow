import { useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import PaletteIcon from "@mui/icons-material/PaletteOutlined";
import ViewComfyIcon from "@mui/icons-material/ViewComfyOutlined";
import ViewCompactIcon from "@mui/icons-material/ViewCompactOutlined";
import StorageIcon from "@mui/icons-material/StorageOutlined";
import TranslateIcon from "@mui/icons-material/TranslateOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import FileDownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadIcon from "@mui/icons-material/FileUploadOutlined";
import TableChartIcon from "@mui/icons-material/TableChartOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForeverOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import LanguageIcon from "@mui/icons-material/Language";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store";
import { ACCENT_COLORS } from "../lib/theme";
import { exportBoardAsJSON, exportTasksAsCSV, parseAndValidateImportJSON } from "../lib/dataTools";
import type { Density, Language, ThemeMode } from "../types";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const themeMode = useTaskStore((s) => s.themeMode);
  const setThemeMode = useTaskStore((s) => s.setThemeMode);
  const accentColor = useTaskStore((s) => s.accentColor);
  const setAccentColor = useTaskStore((s) => s.setAccentColor);
  const density = useTaskStore((s) => s.density);
  const setDensity = useTaskStore((s) => s.setDensity);
  const language = useTaskStore((s) => s.language);
  const setLanguage = useTaskStore((s) => s.setLanguage);
  const clearAllData = useTaskStore((s) => s.clearAllData);
  const tasks = useTaskStore((s) => s.tasks);
  const boards = useTaskStore((s) => s.boards);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const importBoardAndTasks = useTaskStore((s) => s.importBoardAndTasks);
  const setToast = useTaskStore((s) => s.setToast);
  const notificationSettings = useTaskStore((s) => s.notificationSettings);
  const updateNotificationSettings = useTaskStore((s) => s.updateNotificationSettings);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  const handleToggleBrowserNotifications = async (checked: boolean) => {
    if (!checked) {
      updateNotificationSettings({ browserNotifications: false });
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      setToast({ message: t("settings.browserNotSupported") });
      return;
    }

    if (Notification.permission === "granted") {
      updateNotificationSettings({ browserNotifications: true });
      setToast({ message: "Browser notifications enabled!" });
    } else if (Notification.permission === "denied") {
      setToast({ message: t("settings.browserPermissionBlocked") });
    } else {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          updateNotificationSettings({ browserNotifications: true });
          setToast({ message: "Browser notifications enabled!" });
        } else {
          updateNotificationSettings({ browserNotifications: false });
          if (permission === "denied") {
            setToast({ message: t("settings.browserPermissionBlocked") });
          }
        }
      } catch (e) {
        console.warn("TaskFlow: Error requesting notification permission", e);
      }
    }
  };

  const handleLanguageChange = (_: React.MouseEvent<HTMLElement>, newLang: Language | null) => {
    if (newLang) {
      setLanguage(newLang);
      i18n.changeLanguage(newLang);
    }
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { board: importedBoard, tasks: importedTasks } = await parseAndValidateImportJSON(text);
      importBoardAndTasks(importedBoard, importedTasks);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("validation.invalidJson");
      setToast({ message: msg });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" fontWeight={700}>
          {t("settings.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("settings.subtitle")}
        </Typography>
      </Box>

      <Stack spacing={3} sx={{ maxWidth: 760 }}>
        {/* Language Selection */}
        <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <TranslateIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("settings.language")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.languageDesc")}
                </Typography>
              </Box>
            </Stack>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={language}
              onChange={handleLanguageChange}
              aria-label="Interface Language"
            >
              <ToggleButton value="en" sx={{ px: 2, fontWeight: 600 }}>
                English
              </ToggleButton>
              <ToggleButton value="hi" sx={{ px: 2, fontWeight: 600 }}>
                हिन्दी
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Card>

        {/* Theme Mode (Light / Dark / System) */}
        <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <DarkModeIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("settings.themeMode")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.appearanceDesc")}
                </Typography>
              </Box>
            </Stack>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={themeMode}
              onChange={(_, val: ThemeMode | null) => val && setThemeMode(val)}
              aria-label="Theme mode"
            >
              <ToggleButton value="light" sx={{ display: "flex", gap: 0.75, px: 1.5 }}>
                <LightModeIcon fontSize="small" /> {t("settings.light")}
              </ToggleButton>
              <ToggleButton value="dark" sx={{ display: "flex", gap: 0.75, px: 1.5 }}>
                <DarkModeIcon fontSize="small" /> {t("settings.dark")}
              </ToggleButton>
              <ToggleButton value="system" sx={{ display: "flex", gap: 0.75, px: 1.5 }}>
                <SettingsBrightnessIcon fontSize="small" /> {t("settings.system")}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Card>

        {/* Accent Colour Picker (5 colors) */}
        <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <PaletteIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("settings.accentColor")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.accentColorDesc")}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {ACCENT_COLORS.map((c) => {
                const isSelected = accentColor === c.value;
                return (
                  <Box
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: c.value,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      border: 2,
                      borderColor: isSelected ? "text.primary" : "transparent",
                      boxShadow: isSelected ? `0 0 0 3px ${alpha(c.value, 0.35)}` : "none",
                      transition: "all 150ms ease",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>
        </Card>

        {/* Interface Density (Comfortable / Compact) */}
        <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <ViewComfyIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("settings.density")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.densityDesc")}
                </Typography>
              </Box>
            </Stack>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={density}
              onChange={(_, val: Density | null) => val && setDensity(val)}
              aria-label={t("settings.density")}
            >
              <ToggleButton value="comfortable" sx={{ display: "flex", gap: 0.75, px: 1.5 }}>
                <ViewComfyIcon fontSize="small" /> {t("settings.comfortable")}
              </ToggleButton>
              <ToggleButton value="compact" sx={{ display: "flex", gap: 0.75, px: 1.5 }}>
                <ViewCompactIcon fontSize="small" /> {t("settings.compact")}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Card>

        {/* Notifications & Reminders */}
        <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <NotificationsActiveOutlinedIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {t("settings.notificationsTitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.notificationsDesc")}
                </Typography>
              </Box>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.enabled}
                  onChange={(e) => updateNotificationSettings({ enabled: e.target.checked })}
                  color="primary"
                  inputProps={{ "aria-label": t("settings.enableNotifications") }}
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  {notificationSettings.enabled ? t("common.active", "Active") : "Off"}
                </Typography>
              }
              labelPlacement="start"
              sx={{ m: 0 }}
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack
            spacing={2.5}
            sx={{
              opacity: notificationSettings.enabled ? 1 : 0.45,
              pointerEvents: notificationSettings.enabled ? "auto" : "none",
              transition: "opacity 0.2s ease",
            }}
          >
            {/* Overdue Task Alerts */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <WarningAmberRoundedIcon sx={{ color: "error.main" }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t("settings.overdueAlerts")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.overdueAlertsDesc")}
                  </Typography>
                </Box>
              </Stack>
              <Switch
                size="small"
                checked={notificationSettings.overdueAlerts}
                onChange={(e) => updateNotificationSettings({ overdueAlerts: e.target.checked })}
                color="error"
                inputProps={{ "aria-label": t("settings.overdueAlerts") }}
              />
            </Stack>

            {/* Due Today Alerts */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <TodayRoundedIcon sx={{ color: "warning.main" }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t("settings.dueTodayAlerts")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.dueTodayAlertsDesc")}
                  </Typography>
                </Box>
              </Stack>
              <Switch
                size="small"
                checked={notificationSettings.dueTodayAlerts}
                onChange={(e) => updateNotificationSettings({ dueTodayAlerts: e.target.checked })}
                color="warning"
                inputProps={{ "aria-label": t("settings.dueTodayAlerts") }}
              />
            </Stack>

            {/* Upcoming Deadline Alerts */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <ScheduleRoundedIcon sx={{ color: "info.main" }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t("settings.upcomingAlerts")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.upcomingAlertsDesc")}
                  </Typography>
                </Box>
              </Stack>
              <Switch
                size="small"
                checked={notificationSettings.upcomingAlerts}
                onChange={(e) => updateNotificationSettings({ upcomingAlerts: e.target.checked })}
                color="info"
                inputProps={{ "aria-label": t("settings.upcomingAlerts") }}
              />
            </Stack>

            {/* Upcoming Deadline Lead Days Selector */}
            {notificationSettings.upcomingAlerts && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={2}
                sx={{ pl: { xs: 0, sm: 4.5 }, pt: 0.5 }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t("settings.leadTime")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.leadTimeDesc")}
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={notificationSettings.upcomingLeadDays}
                  onChange={(_, val: number | null) => val && updateNotificationSettings({ upcomingLeadDays: val })}
                  aria-label={t("settings.leadTime")}
                >
                  <ToggleButton value={1} sx={{ px: 1.5, fontSize: 12, fontWeight: 600 }}>
                    {t("settings.leadDays_1")}
                  </ToggleButton>
                  <ToggleButton value={2} sx={{ px: 1.5, fontSize: 12, fontWeight: 600 }}>
                    {t("settings.leadDays_2")}
                  </ToggleButton>
                  <ToggleButton value={3} sx={{ px: 1.5, fontSize: 12, fontWeight: 600 }}>
                    {t("settings.leadDays_3")}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            )}

            <Divider sx={{ my: 1 }} />

            {/* Browser Notifications Toggle */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <LanguageIcon sx={{ color: "primary.main" }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t("settings.browserNotifications")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t("settings.browserNotificationsDesc")}
                  </Typography>
                </Box>
              </Stack>
              <Switch
                size="small"
                checked={notificationSettings.browserNotifications}
                onChange={(e) => void handleToggleBrowserNotifications(e.target.checked)}
                color="primary"
                inputProps={{ "aria-label": t("settings.browserNotifications") }}
              />
            </Stack>
          </Stack>
        </Card>

        {/* Data Tools & Backup */}
        <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <StorageIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {t("settings.dataTools")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("settings.dataToolsDesc")}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t("settings.totalActiveTasks", { count: boards.length })}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {t("board.taskCount", { count: tasks.length })}
            </Typography>
          </Box>

          <input
            id="settings-import-file-input"
            name="settingsImportFile"
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: "none" }}
            onChange={handleImportFile}
            aria-label={t("settings.importJSON")}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => {
                if (activeBoard) exportBoardAsJSON(activeBoard, tasks);
              }}
            >
              {t("settings.exportJSON")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TableChartIcon />}
              onClick={() => {
                if (activeBoard) exportTasksAsCSV(activeBoard, tasks);
              }}
            >
              {t("settings.exportCSV")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("settings.importJSON")}
            </Button>
          </Stack>
        </Card>

        {/* Danger Zone: Clear All Data */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            borderColor: (t) => alpha(t.palette.error.main, 0.4),
            bgcolor: (t) => alpha(t.palette.error.main, t.palette.mode === "light" ? 0.03 : 0.06),
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: (t) => alpha(t.palette.error.main, 0.15),
                  color: "error.main",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <WarningAmberIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="error.main">
                  {t("settings.dangerZone")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.clearDataDesc")}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setConfirmClearOpen(true)}
            >
              {t("settings.clearData")}
            </Button>
          </Stack>
        </Paper>
      </Stack>

      {/* Confirm Clear All Data Dialog */}
      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
          {t("settings.confirmClearTitle")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t("settings.confirmClearMsg")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmClearOpen(false)} color="inherit">
            {t("task.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              clearAllData();
              setConfirmClearOpen(false);
            }}
          >
            {t("settings.confirmBtn")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
