import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle({ className = "theme-toggle" }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      aria-pressed={dark}
      title={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      data-testid="theme-toggle-button"
    >
      {dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}

export default ThemeToggle;
