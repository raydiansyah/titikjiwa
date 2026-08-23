import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, getPreferredTheme, persistTheme } from "@/lib/theme";
const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });
export function ThemeProvider({ children }) { const [theme, setTheme] = useState(getPreferredTheme); useEffect(() => { applyTheme(theme); persistTheme(theme); }, [theme]); const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") }), [theme]); return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>; }
export function useTheme() { return useContext(ThemeContext); }
