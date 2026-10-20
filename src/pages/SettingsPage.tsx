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
  Paper,
  Stack,
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

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

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
      const msg = err instanceof Error ? err.message : "Failed to import JSON file";
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
              aria-label="Interface density"
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
              Total active tasks across {boards.length} board{boards.length > 1 ? "s" : ""}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {tasks.length} tasks
            </Typography>
          </Box>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: "none" }}
            onChange={handleImportFile}
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
