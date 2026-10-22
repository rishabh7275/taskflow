import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import KeyboardIcon from "@mui/icons-material/KeyboardOutlined";
import { useTaskStore } from "../store";

export default function ShortcutsDialog() {
  const { t } = useTranslation();
  const isOpen = useTaskStore((s) => s.isShortcutsOpen);
  const setOpen = useTaskStore((s) => s.setShortcutsOpen);

  const shortcuts = [
    { key: "N", description: t("shortcuts.newTask") },
    { key: "/", description: t("shortcuts.focusSearch") },
    { key: "⌘K / Ctrl+K", description: t("shortcuts.commandPalette") },
    { key: "?", description: t("shortcuts.help") },
    { key: "⌘Z / Ctrl+Z", description: t("shortcuts.undo") },
    { key: "⌘Shift+Z / Ctrl+Shift+Z", description: t("shortcuts.redo") },
    { key: "Esc", description: t("shortcuts.closeModal") },
  ];

  return (
    <Dialog open={isOpen} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <KeyboardIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          {t("shortcuts.title")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {shortcuts.map((s, idx) => (
            <Box key={s.key}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 0.5,
                }}
              >
                <Typography variant="body2">{s.description}</Typography>
                <Box
                  component="kbd"
                  sx={{
                    px: 1,
                    py: 0.35,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.default",
                    fontFamily: "monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                  }}
                >
                  {s.key}
                </Box>
              </Box>
              {idx < shortcuts.length - 1 && <Divider sx={{ my: 0.5 }} />}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={() => setOpen(false)} variant="contained" size="small">
          {t("shortcuts.gotIt")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
