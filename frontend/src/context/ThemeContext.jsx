import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const ACCENT_COLORS = {
  violet: {
    primary: "#7C3AED",
    light: "#8B5CF6",
    soft: "#A78BFA",
    glow: "rgba(124, 58, 237, 0.25)",
    border: "rgba(124, 58, 237, 0.4)",
  },
  blue: {
    primary: "#2563EB",
    light: "#3B82F6",
    soft: "#60A5FA",
    glow: "rgba(37, 99, 235, 0.25)",
    border: "rgba(37, 99, 235, 0.4)",
  },
  emerald: {
    primary: "#059669",
    light: "#10B981",
    soft: "#34D399",
    glow: "rgba(5, 150, 105, 0.25)",
    border: "rgba(5, 150, 105, 0.4)",
  },
  rose: {
    primary: "#E11D48",
    light: "#F43F5E",
    soft: "#FB7185",
    glow: "rgba(225, 29, 72, 0.25)",
    border: "rgba(225, 29, 72, 0.4)",
  },
};

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, accentKey) {
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "system" && getSystemTheme() === "dark");
  const accent = ACCENT_COLORS[accentKey] || ACCENT_COLORS.violet;

  if (isDark) {
    root.setAttribute("data-theme", "dark");
    root.style.setProperty("--bg-base", "#0B1020");
    root.style.setProperty("--bg-secondary", "#0F1628");
    root.style.setProperty("--bg-card", "#111827");
    root.style.setProperty("--bg-sidebar", "#0A0F1E");
    root.style.setProperty("--bg-input", "#0B1020");
    root.style.setProperty("--text-primary", "#F8FAFC");
    root.style.setProperty("--text-secondary", "#94A3B8");
    root.style.setProperty("--text-muted", "#64748B");
    root.style.setProperty("--border", "rgba(255,255,255,0.08)");
    root.style.setProperty("--border-strong", "rgba(255,255,255,0.14)");
    root.style.setProperty("--shadow-card", "0 8px 36px rgba(0,0,0,0.55)");
  } else {
    root.setAttribute("data-theme", "light");
    root.style.setProperty("--bg-base", "#F1F5F9");
    root.style.setProperty("--bg-secondary", "#E2E8F0");
    root.style.setProperty("--bg-card", "#FFFFFF");
    root.style.setProperty("--bg-sidebar", "#0B1020");
    root.style.setProperty("--bg-input", "#F8FAFC");
    root.style.setProperty("--text-primary", "#0F172A");
    root.style.setProperty("--text-secondary", "#475569");
    root.style.setProperty("--text-muted", "#94A3B8");
    root.style.setProperty("--border", "rgba(0,0,0,0.08)");
    root.style.setProperty("--border-strong", "rgba(0,0,0,0.14)");
    root.style.setProperty("--shadow-card", "0 4px 24px rgba(0,0,0,0.12)");
  }

  // Apply accent colors
  root.style.setProperty("--accent", accent.light);
  root.style.setProperty("--accent-primary", accent.primary);
  root.style.setProperty("--accent-soft", accent.soft);
  root.style.setProperty("--accent-glow", accent.glow);
  root.style.setProperty("--accent-border", accent.border);
  root.style.setProperty("--border-focus", accent.border);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("brandpulse_theme") || "dark");
  const [accentColor, setAccentColorState] = useState(() => localStorage.getItem("brandpulse_accent") || "violet");
  const [compactLayout, setCompactLayoutState] = useState(() => localStorage.getItem("brandpulse_compact") === "true");

  useEffect(() => {
    applyTheme(theme, accentColor);

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system", accentColor);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, accentColor]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("brandpulse_theme", newTheme);
    applyTheme(newTheme, accentColor);
  };

  const setAccentColor = (newAccent) => {
    setAccentColorState(newAccent);
    localStorage.setItem("brandpulse_accent", newAccent);
    applyTheme(theme, newAccent);
  };

  const setCompactLayout = (val) => {
    setCompactLayoutState(val);
    localStorage.setItem("brandpulse_compact", String(val));
  };

  const isDark = theme === "dark" || (theme === "system" && getSystemTheme() === "dark");

  return (
    <ThemeContext.Provider value={{
      theme,
      accentColor,
      compactLayout,
      isDark,
      setTheme,
      setAccentColor,
      setCompactLayout,
      accentColors: ACCENT_COLORS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
