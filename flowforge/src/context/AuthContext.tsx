import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, AUTH_KEY, USER_KEY } from "../api/client";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(() => !!localStorage.getItem(AUTH_KEY));

  const persistSession = (data: AuthResponse) => {
    localStorage.setItem(AUTH_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem(AUTH_KEY, token);
      window.history.replaceState({}, "", window.location.pathname);
      api
        .get<{ user: User; token: string }>("/auth/me")
        .then((res) => {
          if (!active) return;
          setUser(res.data.user);
          localStorage.setItem(AUTH_KEY, res.data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        })
        .catch(() => { if (active) logout(); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }

    const storedToken = localStorage.getItem(AUTH_KEY);
    if (!storedToken) {
      return () => { active = false; };
    }

    api
      .get<{ user: User; token: string }>("/auth/me")
      .then((res) => {
        if (!active) return;
        setUser(res.data.user);
        localStorage.setItem(AUTH_KEY, res.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      })
      .catch(() => { if (active) logout(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [logout]);

  const login = async (payload: LoginPayload) => {
    const res = await api.post<AuthResponse>("/auth/login", payload);
    persistSession(res.data);
  };

  const register = async (payload: RegisterPayload) => {
    await api.post("/auth/register", payload);
    const res = await api.post<AuthResponse>("/auth/login", payload);
    persistSession(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
