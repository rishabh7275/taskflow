import { createTheme, type PaletteMode } from "@mui/material";
import type { AccentColor, Density } from "../types";

const bodyFont =
  '"DM Sans Variable", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif';
const headingFont =
  '"Bricolage Grotesque Variable", "Noto Sans Devanagari", "DM Sans Variable", system-ui, sans-serif';
const heading = { fontFamily: headingFont, fontWeight: 700, letterSpacing: "-0.02em" };

export const ACCENT_COLORS: { name: string; value: AccentColor }[] = [
  { name: "Indigo", value: "#4F46E5" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#E11D48" },
  { name: "Amber", value: "#D97706" },
];

export const createAppTheme = (
  mode: PaletteMode,
  accentColor: AccentColor = "#4F46E5",
  density: Density = "comfortable"
) => {
  const light = mode === "light";
  const isCompact = density === "compact";

  return createTheme({
    palette: light
      ? {
          mode,
          primary: { main: accentColor },
          background: { default: "#F6F7FB", paper: "#FFFFFF" },
          text: { primary: "#0F172A", secondary: "#5B6478" },
          divider: "#E6E8F0",
        }
      : {
          mode,
          primary: { main: accentColor },
          background: { default: "#14171F", paper: "#1C202B" },
          text: { primary: "#EDEFF6", secondary: "#9AA3B8" },
          divider: "#2C3242",
        },
    shape: { borderRadius: isCompact ? 10 : 14 },
    typography: {
      fontFamily: bodyFont,
      h1: heading,
      h2: heading,
      h3: heading,
      h4: heading,
      h5: heading,
      h6: heading,
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: light
              ? `radial-gradient(900px 400px at 8% -8%, ${accentColor}14, transparent 60%)`
              : `radial-gradient(900px 400px at 8% -8%, ${accentColor}1A, transparent 60%)`,
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: isCompact ? 8 : 12,
            padding: isCompact ? "4px 10px" : undefined,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
          outlined: {
            boxShadow: light
              ? "0 1px 2px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.04)"
              : "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            transition: "transform 150ms ease, box-shadow 150ms ease",
            boxShadow: light
              ? "0 1px 2px rgba(16,24,40,0.06), 0 4px 12px rgba(16,24,40,0.05)"
              : "none",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: light
                ? "0 2px 4px rgba(16,24,40,0.08), 0 10px 24px rgba(16,24,40,0.10)"
                : "0 8px 24px rgba(0,0,0,0.35)",
            },
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
              "&:hover": { transform: "none" },
            },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiToggleButton: {
        styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: isCompact ? 14 : 20 } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: 12, marginTop: 4 } } },
    },
  });
};
