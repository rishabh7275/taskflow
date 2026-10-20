import { lazy, Suspense, useEffect, useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";
import { createAppTheme } from "./lib/theme";
import { useTaskStore } from "./store";

const BoardPage = lazy(() => import("./pages/BoardPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  const mode = useTaskStore((s) => s.mode);
  const themeMode = useTaskStore((s) => s.themeMode);
  const accentColor = useTaskStore((s) => s.accentColor);
  const density = useTaskStore((s) => s.density);
  const setMode = useTaskStore((s) => s.setMode);

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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/board" replace />} />
            <Route element={<Layout />}>
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
      </ErrorBoundary>
    </ThemeProvider>
  );
}
