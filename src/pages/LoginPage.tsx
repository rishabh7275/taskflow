import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth, getFriendlyAuthErrorMessage } from "../hooks";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [tabIndex, setTabIndex] = useState<0 | 1>(0); // 0 = signin, 1 = signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to /board
  if (!loading && user) {
    return <Navigate to="/board" replace />;
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue as 0 | 1);
    setErrorMessage(null);
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(t("auth.errorEnterEmail"));
      return;
    }
    if (!password) {
      setErrorMessage(t("auth.errorEnterPassword"));
      return;
    }
    if (tabIndex === 1) {
      if (password.length < 6) {
        setErrorMessage(t("auth.errorPasswordLength"));
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(t("auth.errorPasswordMatch"));
        return;
      }
    }

    setSubmitting(true);
    try {
      if (tabIndex === 0) {
        await signInWithEmail(cleanEmail, password);
      } else {
        await signUpWithEmail(cleanEmail, password);
      }
      navigate("/board", { replace: true });
    } catch (err) {
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      navigate("/board", { replace: true });
    } catch (err) {
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const isAnyLoading = submitting || googleSubmitting;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2.5,
        bgcolor: "background.default",
        background: (tTheme) =>
          tTheme.palette.mode === "dark"
            ? `radial-gradient(ellipse at 50% 0%, ${alpha(tTheme.palette.primary.dark, 0.25)} 0%, ${tTheme.palette.background.default} 70%)`
            : `radial-gradient(ellipse at 50% 0%, ${alpha(tTheme.palette.primary.light, 0.18)} 0%, ${tTheme.palette.background.default} 70%)`,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 4,
          border: 1,
          borderColor: "divider",
          boxShadow: (tTheme) =>
            tTheme.palette.mode === "dark"
              ? "0 16px 40px -8px rgba(0,0,0,0.6)"
              : "0 16px 40px -8px rgba(15,23,42,0.08)",
          bgcolor: "background.paper",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Brand header */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "grid",
                placeItems: "center",
                mb: 1.5,
                boxShadow: (tTheme) => `0 8px 16px -4px ${alpha(tTheme.palette.primary.main, 0.4)}`,
              }}
            >
              <TaskAltIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h5" component="h1" fontWeight={700} sx={{ letterSpacing: "-0.02em" }}>
              {t("common.appName")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("common.tagline")}
            </Typography>
          </Box>

          {/* Mode Tabs */}
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 3,
              minHeight: 42,
              bgcolor: (tTheme) => alpha(tTheme.palette.action.selected, 0.5),
              borderRadius: 2.5,
              p: 0.5,
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTab-root": {
                minHeight: 36,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: 13.5,
                textTransform: "none",
                color: "text.secondary",
                transition: "all 0.15s ease",
                "&.Mui-selected": {
                  color: "primary.main",
                  bgcolor: "background.paper",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                },
              },
            }}
          >
            <Tab label={t("auth.signIn")} disabled={isAnyLoading} />
            <Tab label={t("auth.createAccount")} disabled={isAnyLoading} />
          </Tabs>

          {errorMessage && (
            <Alert
              severity="error"
              onClose={() => setErrorMessage(null)}
              sx={{ mb: 2.5, borderRadius: 2, fontSize: 13.5 }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Google Continue Button */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={isAnyLoading}
            startIcon={googleSubmitting ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
            sx={{
              py: 1.2,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              borderColor: "divider",
              color: "text.primary",
              bgcolor: (tTheme) => alpha(tTheme.palette.action.hover, 0.2),
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: (tTheme) => alpha(tTheme.palette.primary.main, 0.04),
              },
            }}
          >
            {googleSubmitting ? t("auth.connectingGoogle") : t("auth.continueGoogle")}
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", my: 2.5 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="caption" sx={{ px: 1.5, color: "text.secondary", fontWeight: 500 }}>
              {t("auth.orEmail")}
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>

          {/* Email / Password Form */}
          <Box component="form" onSubmit={handleEmailAuth} noValidate>
            <TextField
              margin="dense"
              required
              fullWidth
              id="auth-email"
              label={t("auth.email")}
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAnyLoading}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              required
              fullWidth
              name="password"
              label={t("auth.password")}
              type={showPassword ? "text" : "password"}
              id="auth-password"
              autoComplete={tabIndex === 0 ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAnyLoading}
              helperText={tabIndex === 1 ? t("auth.passwordMin") : undefined}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("auth.togglePasswordAria")}
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      disabled={isAnyLoading}
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: tabIndex === 1 ? 2 : 2.5 }}
            />

            {tabIndex === 1 && (
              <TextField
                margin="dense"
                required
                fullWidth
                name="confirmPassword"
                label={t("auth.confirmPassword")}
                type={showPassword ? "text" : "password"}
                id="auth-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isAnyLoading}
                sx={{ mb: 2.5 }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isAnyLoading}
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {submitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : tabIndex === 0 ? (
                t("auth.signIn")
              ) : (
                t("auth.createAccount")
              )}
            </Button>
          </Box>

          {/* Bottom switch link */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {tabIndex === 0 ? t("auth.noAccount") : t("auth.haveAccount")}
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setTabIndex(tabIndex === 0 ? 1 : 0);
                  setErrorMessage(null);
                }}
                disabled={isAnyLoading}
                sx={{
                  p: 0,
                  minWidth: "auto",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "inherit",
                  verticalAlign: "baseline",
                }}
              >
                {tabIndex === 0 ? t("auth.signUpLink") : t("auth.signInLink")}
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
