import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const AUTH_STORAGE_KEY = "o2con_hub_auth";
const TOKEN_STORAGE_KEY = "o2con_hub_token";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredAuth(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored && token) {
      const user = JSON.parse(stored) as AuthUser;
      return { token, user, isAuthenticated: true };
    }
  } catch {
    // ignore parse errors
  }
  return { token: null, user: null, isAuthenticated: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStoredAuth);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored && token) {
      setState({
        token,
        user: JSON.parse(stored) as AuthUser,
        isAuthenticated: true,
      });
    }
  }, []);

  const login = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setState({ token, user, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({ token: null, user: null, isAuthenticated: false });
  }, []);

  const getToken = useCallback(() => state.token, [state.token]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
