import { Box, Button, Container, Paper, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOffOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";

export default function NotFoundPage() {
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
            bgcolor: (t) => t.palette.mode === "light" ? "grey.100" : "grey.800",
            color: "text.secondary",
            display: "grid",
            placeItems: "center",
          }}
        >
          <SearchOffIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          404 - Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </Typography>
        <Button
          component={RouterLink}
          to="/board"
          variant="contained"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 1 }}
        >
          Back to board
        </Button>
      </Paper>
    </Container>
  );
}
