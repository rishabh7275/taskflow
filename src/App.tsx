import { lazy, Suspense, useEffect, useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";
import { createAppTheme } from "./lib/theme";
import { useTaskStore } from "./store";
import { AuthProvider } from "./context";
import { useFirestoreSync, useAuth } from "./hooks";
import i18n from "./lib/i18n";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  return user ? <Navigate to="/board" replace /> : <Navigate to="/login" replace />;
}

function AppContent() {
  // Sync authenticated user workspace with Firestore and user-scoped storage
  useFirestoreSync();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route path="/" element={<RootRedirect />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/board"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <BoardPage />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const mode = useTaskStore((s) => s.mode);
  const themeMode = useTaskStore((s) => s.themeMode);
  const accentColor = useTaskStore((s) => s.accentColor);
  const density = useTaskStore((s) => s.density);
  const setMode = useTaskStore((s) => s.setMode);
  const language = useTaskStore((s) => s.language);

  // Sync language with i18n and document element
  useEffect(() => {
    if (language) {
      if (i18n.language !== language) {
        void i18n.changeLanguage(language);
      }
      if (typeof document !== "undefined") {
        document.documentElement.lang = language === "hi" ? "hi-IN" : "en-IN";
      }
    }
  }, [language]);

  // System theme preference listener
  useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? "dark" : "light");
    };

    setMode(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode, setMode]);

  const theme = useMemo(
    () => createAppTheme(mode, accentColor, density),
    [mode, accentColor, density]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
