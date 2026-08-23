import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let active = true;

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (active) setState({ loading: false, user: data });
      })
      .catch(() => {
        if (active) setState({ loading: false, user: null });
      });

    return () => {
      active = false;
    };
  }, []);

  const auth = useMemo(
    () => ({
      ...state,
      login: async (payload) => {
        const { data } = await api.post("/auth/login", payload);
        setState({ loading: false, user: data.user });
        return data.user;
      },
      register: async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        setState({ loading: false, user: data.user });
        return data.user;
      },
      logout: async () => {
        await api.post("/auth/logout").catch(() => {});
        setState({ loading: false, user: null });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
