import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import { collectSystemKeysFromUnknown, collectSystemsFromJwtClaims } from "@/lib/user-systems";

const AUTH_STORAGE_KEY = "o2con_hub_auth";
const TOKEN_STORAGE_KEY = "o2con_hub_token";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: "admin" | "user";
  systems?: string[];
  systemPermissions?: Record<string, "viewer" | "editor" | "admin">;
}

function normalizeRole(role: unknown): "admin" | "user" {
  const value = String(role || "")
    .trim()
    .toLowerCase();
  if (value === "admin" || value === "administrator" || value === "adm") {
    return "admin";
  }
  return "user";
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function inferRoleFromClaims(claims: Record<string, unknown> | null): "admin" | "user" {
  if (!claims) return "user";

  const booleanFlags = [claims.isAdmin, claims.admin, claims.is_admin];
  if (booleanFlags.some((flag) => flag === true)) return "admin";

  const scalarCandidates = [
    claims.role,
    claims.userRole,
    claims.profile,
    claims.perfil,
    claims.type,
    claims.tipo,
  ];
  for (const candidate of scalarCandidates) {
    if (normalizeRole(candidate) === "admin") return "admin";
  }

  const arrayCandidates = [claims.roles, claims.permissions, claims.scopes, claims.perfis];
  for (const candidate of arrayCandidates) {
    if (!Array.isArray(candidate)) continue;
    if (candidate.some((item) => normalizeRole(item) === "admin")) return "admin";
  }

  return "user";
}

function normalizeUser(user: AuthUser, token?: string): AuthUser {
  const claims = token ? decodeJwtPayload(token) : null;
  const roleFromClaims = inferRoleFromClaims(claims);
  const finalRole =
    roleFromClaims === "admin" || normalizeRole(user.role) === "admin"
      ? "admin"
      : "user";

  const systemsFromProfile = collectSystemKeysFromUnknown(user.systems);
  const systemsFromToken = claims ? collectSystemsFromJwtClaims(claims) : [];
  const systemsMerged = Array.from(new Set([...systemsFromProfile, ...systemsFromToken]));

  return {
    ...user,
    role: finalRole,
    systems: systemsMerged.length > 0 ? systemsMerged : Array.isArray(user.systems) ? user.systems : [],
  };
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: AuthUser, options?: { rememberMe?: boolean }) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): { token: string | null; userJson: string | null } {
  // Prefer persistent storage, but fall back to session.
  const token = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
  const userJson = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
  return { token, userJson };
}

function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function writeStoredAuth(token: string, userJson: string, rememberMe: boolean): void {
  // Store in exactly one place to avoid "stale token" confusion.
  clearStoredAuth();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_STORAGE_KEY, token);
  storage.setItem(AUTH_STORAGE_KEY, userJson);
}

function loadStoredAuth(): AuthState {
  try {
    const { token, userJson } = readStoredAuth();
    if (userJson && token) {
      const user = normalizeUser(JSON.parse(userJson) as AuthUser, token);
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
    const { token, userJson } = readStoredAuth();
    if (userJson && token) {
      const parsedUser = normalizeUser(JSON.parse(userJson) as AuthUser, token);
      setState({
        token,
        user: parsedUser,
        isAuthenticated: true,
      });
      // Refresh stored user with normalized values, keeping current persistence choice.
      const isRemembered = Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
      writeStoredAuth(token, JSON.stringify(parsedUser), isRemembered);
    }
  }, []);

  const login = useCallback((token: string, user: AuthUser, options?: { rememberMe?: boolean }) => {
    const normalizedUser = normalizeUser(user, token);
    writeStoredAuth(token, JSON.stringify(normalizedUser), options?.rememberMe === true);
    setState({ token, user: normalizedUser, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
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
