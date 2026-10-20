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

const SHORTCUTS = [
  { key: "N", description: "Create a new task" },
  { key: "/", description: "Focus search bar" },
  { key: "⌘K / Ctrl+K", description: "Open Command Palette" },
  { key: "?", description: "Open keyboard shortcuts help" },
  { key: "⌘Z / Ctrl+Z", description: "Undo last task change" },
  { key: "⌘Shift+Z / Ctrl+Shift+Z", description: "Redo undone action" },
  { key: "Esc", description: "Close active modal or palette" },
];

export default function ShortcutsDialog() {
  const isOpen = useTaskStore((s) => s.isShortcutsOpen);
  const setOpen = useTaskStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={isOpen} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <KeyboardIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Keyboard Shortcuts
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {SHORTCUTS.map((s, idx) => (
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
              {idx < SHORTCUTS.length - 1 && <Divider sx={{ my: 0.5 }} />}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={() => setOpen(false)} variant="contained" size="small">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
