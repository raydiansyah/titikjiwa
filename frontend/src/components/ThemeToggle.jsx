import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, onToggle, className = "theme-toggle" }) {
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      aria-pressed={dark}
      title={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      data-testid="theme-toggle-button"
    >
      {dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}
