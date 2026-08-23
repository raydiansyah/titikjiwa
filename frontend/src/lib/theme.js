export const THEME_STORAGE_KEY = "tj-theme";
export const THEMES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
});

export function isTheme(value) {
  return value === THEMES.LIGHT || value === THEMES.DARK;
}

export function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : null;
}

export function getPreferredTheme() {
  const stored = getStoredTheme();
  if (stored) return stored;

  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return THEMES.LIGHT;
  }

  return THEMES.DARK;
}

export function applyTheme(theme) {
  if (typeof document === "undefined" || !isTheme(theme)) return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === THEMES.DARK);
  root.setAttribute("data-theme", theme);
}

export function persistTheme(theme) {
  if (typeof window === "undefined" || !isTheme(theme)) return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
}
