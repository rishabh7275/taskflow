import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          {board ? t("boards.renameBoard") : t("boards.newBoard")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label={t("boards.nameLabel")}
              placeholder={t("boards.namePlaceholder")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setError(false);
              }}
              error={error}
              helperText={error ? t("boards.nameRequired") : " "}
            />
            <TextField
              fullWidth
              label={t("boards.descLabel")}
              placeholder={t("boards.descPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained">
            {board ? t("common.save") : t("common.create")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
