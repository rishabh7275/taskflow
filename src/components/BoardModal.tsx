import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import type { Board } from "../types";

interface Props {
  open: boolean;
  board: Board | null;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
}

export default function BoardModal({ open, board, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setName(board?.name ?? "");
      setDescription(board?.description ?? "");
      setError(false);
    }
  }, [open, board]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(true);
      return;
    }
    onSave(name.trim(), description.trim());
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {board ? "Rename Board" : "New Board"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label="Board Name"
              placeholder="e.g. Sprint 24, Marketing, Personal"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setError(false);
              }}
              error={error}
              helperText={error ? "Board name cannot be empty" : " "}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              placeholder="Brief purpose of this board"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {board ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
