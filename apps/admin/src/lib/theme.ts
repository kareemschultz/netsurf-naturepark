import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

export function initTheme(): void {
  try {
    if (localStorage.getItem("admin-theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch {}
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("admin-theme") === "dark" ? "dark" : "light") as Theme;
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem("admin-theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
