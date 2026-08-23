import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, getPreferredTheme, persistTheme, THEMES } from "@/lib/theme";

const ThemeContext = createContext({
  theme: THEMES.DARK,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
