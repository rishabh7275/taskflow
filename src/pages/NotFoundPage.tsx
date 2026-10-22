import { useTranslation } from "react-i18next";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOffOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Container
      maxWidth="sm"
      sx={{
        py: 10,
        display: "grid",
        placeItems: "center",
        minHeight: "60vh",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 5,
          textAlign: "center",
          borderRadius: 4,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: (theme) => theme.palette.mode === "light" ? "grey.100" : "grey.800",
            color: "text.secondary",
            display: "grid",
            placeItems: "center",
          }}
        >
          <SearchOffIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {t("notFound.title")}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("notFound.subtitle")}
        </Typography>
        <Button
          component={RouterLink}
          to="/board"
          variant="contained"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 1 }}
        >
          {t("notFound.backToBoard")}
        </Button>
      </Paper>
    </Container>
  );
}
