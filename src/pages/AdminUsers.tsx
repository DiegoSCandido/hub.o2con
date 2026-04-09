import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { isHubAlwaysVisibleSystem } from "@/lib/hub-always-visible-systems";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserRole = "admin" | "user";
/** O que o backend costuma aceitar por sistema (perfil "Admin" do usuário é o campo `role`, não isto). */
type SystemScopePermission = "viewer" | "editor";
type SystemAccessLevel = SystemScopePermission | "inactive";
type SystemKey =
  | "alvaras"
  | "certificados"
  | "cnds"
  | "processos"
  | "cadastro_empresas"
  | "procuracoes"
  | "fiscal"
  | "simples_nacional";

/** Sistemas que o admin pode atribuir (Simples Nacional fica sempre no hub — ver `hub-always-visible-systems`). */
const DASHBOARD_SYSTEMS: SystemKey[] = [
  "alvaras",
  "certificados",
  "cnds",
  "processos",
  "cadastro_empresas",
  "procuracoes",
  "fiscal",
];

const SYSTEM_LABELS: Record<SystemKey, string> = {
  alvaras: "alvaras",
  certificados: "certificados",
  cnds: "cnd's",
  processos: "gestao de processos",
  cadastro_empresas: "cadastro de empresas",
  procuracoes: "procuracoes",
  fiscal: "situacao fiscal",
  simples_nacional: "consulta simples nacional",
};

/** Alinha nomes vindos da API com as chaves do hub (ex.: consulta_simples_nacional → simples_nacional). */
function normalizeSystemKeyFromApi(value: string): SystemKey | null {
  const key = value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  const alias: Record<string, SystemKey> = {
    alvaras: "alvaras",
    certificados: "certificados",
    cnds: "cnds",
    cnd: "cnds",
    processos: "processos",
    gestao_de_processos: "processos",
    cadastro_empresas: "cadastro_empresas",
    cadastro_de_empresas: "cadastro_empresas",
    procuracoes: "procuracoes",
    fiscal: "fiscal",
    situacao_fiscal: "fiscal",
    simples_nacional: "simples_nacional",
    consulta_simples_nacional: "simples_nacional",
    simples: "simples_nacional",
    consulta_simples: "simples_nacional",
  };
  return alias[key] || null;
}

/** Slugs que o enum Zod do backend pode exigir (inverso de `normalizeSystemKeyFromApi`). */
function systemKeyToBackendSlug(key: SystemKey): string {
  const slug: Partial<Record<SystemKey, string>> = {
    processos: "gestao_de_processos",
    cadastro_empresas: "cadastro_de_empresas",
    fiscal: "situacao_fiscal",
    simples_nacional: "consulta_simples_nacional",
  };
  return slug[key] ?? key;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const k of Object.keys(next)) {
    if (next[k as keyof T] === undefined) delete next[k as keyof T];
  }
  return next;
}

/** Tenta salvar com vários formatos de `systems` até o Zod do backend aceitar. */
async function saveAdminUserPayloadVariants(
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>,
  path: string,
  method: "PUT" | "POST",
  base: Record<string, unknown>,
  systemsToSave: SystemKey[],
  perm: Record<string, SystemScopePermission>
): Promise<void> {
  const keyLevel = (slug: (k: SystemKey) => string) =>
    systemsToSave.map((k) => ({ key: slug(k), level: perm[k] }));
  const systemPermission = (slug: (k: SystemKey) => string) =>
    systemsToSave.map((k) => ({ system: slug(k), permission: perm[k] }));
  const systemPermissionUpper = (slug: (k: SystemKey) => string) =>
    systemsToSave.map((k) => ({
      system: slug(k),
      permission: perm[k] === "viewer" ? "VIEWER" : "EDITOR",
    }));
  const record = (slug: (k: SystemKey) => string) =>
    Object.fromEntries(systemsToSave.map((k) => [slug(k), perm[k]]));

  const id = (k: SystemKey) => k;
  const variants: Record<string, unknown>[] = [
    { ...base, systems: systemPermission(id), systemPermissions: perm },
    { ...base, systems: systemPermission(id) },
    { ...base, systems: systemPermission(systemKeyToBackendSlug), systemPermissions: perm },
    { ...base, systems: systemPermission(systemKeyToBackendSlug) },
    { ...base, systems: systemPermissionUpper(id) },
    { ...base, systems: systemPermissionUpper(systemKeyToBackendSlug) },
    { ...base, systems: keyLevel(id), systemPermissions: perm },
    { ...base, systems: keyLevel(id) },
    { ...base, systems: keyLevel(systemKeyToBackendSlug), systemPermissions: perm },
    { ...base, systems: keyLevel(systemKeyToBackendSlug) },
    { ...base, systems: record(id) },
    { ...base, systems: record(systemKeyToBackendSlug) },
    { ...base, systems: systemsToSave, systemPermissions: perm },
    { ...base, systemPermissions: perm },
  ];

  let lastErr: unknown;
  for (const body of variants) {
    try {
      await apiFetch(path, {
        method,
        body: JSON.stringify(stripUndefined(body as Record<string, unknown>)),
      });
      return;
    } catch (e) {
      lastErr = e;
      const status = (e as ApiRequestError).status;
      if (status !== 400) throw e;
    }
  }
  throw lastErr;
}

function normalizeSystemPermissionFromApi(value: unknown): SystemScopePermission {
  const s = String(value || "")
    .trim()
    .toLowerCase();
  if (s === "viewer" || s === "read" || s === "visualizador") return "viewer";
  if (s === "editor" || s === "write") return "editor";
  /** `admin` por sistema costuma ser rejeitado pelo backend; tratamos como acesso total ao módulo = editor. */
  if (s === "admin" || s === "administrator" || s === "adm") return "editor";
  return "editor";
}

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  systems: SystemKey[];
  systemPermissions?: Partial<Record<SystemKey, SystemScopePermission>>;
  createdAt: string;
  updatedAt: string;
};

function normalizeAdminUserFromApi(u: AdminUser): AdminUser {
  const systems = Array.from(
    new Set(
      (u.systems || [])
        .map((s) => normalizeSystemKeyFromApi(String(s)))
        .filter((s): s is SystemKey => s !== null)
    )
  );
  const systemPermissions: Partial<Record<SystemKey, SystemScopePermission>> = {};
  if (u.systemPermissions) {
    for (const [k, v] of Object.entries(u.systemPermissions)) {
      const nk = normalizeSystemKeyFromApi(k);
      if (nk && v != null) systemPermissions[nk] = normalizeSystemPermissionFromApi(v);
    }
  }
  return { ...u, systems, systemPermissions };
}

type AdminUsersApiResponse = AdminUser[] | {
  users?: AdminUser[];
  data?: AdminUser[] | {
    users?: AdminUser[];
    items?: AdminUser[];
    rows?: AdminUser[];
    results?: AdminUser[];
    availableSystems?: SystemKey[];
    systems?: SystemKey[];
  };
  items?: AdminUser[];
  rows?: AdminUser[];
  results?: AdminUser[];
  availableSystems?: SystemKey[];
  systems?: SystemKey[];
};

type ApiRequestError = Error & { status?: number };

type UserForm = {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  systems: SystemKey[];
  systemPermissions: Partial<Record<SystemKey, SystemScopePermission>>;
};

const EMPTY_FORM: UserForm = {
  email: "",
  fullName: "",
  password: "",
  role: "user",
  isActive: true,
  systems: ["alvaras"],
  systemPermissions: { alvaras: "editor" },
};

function AdminUsersContent() {
  const { user, getToken } = useAuth();
  const { effectiveMainOffset, setMobileMenuOpen } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [systems, setSystems] = useState<SystemKey[]>(DASHBOARD_SYSTEMS);
  const [backendSystems, setBackendSystems] = useState<SystemKey[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === "admin";
  const apiUrl = import.meta.env.VITE_API_URL || "/api";
  const token = getToken();

  const canSubmit = useMemo(() => {
    if (!form.fullName.trim()) return false;
    if (!editing && (!form.email.trim() || !form.password.trim())) return false;
    return true;
  }, [editing, form.email, form.fullName, form.password]);

  const systemsInAuthModal = useMemo(
    () => systems.filter((s) => !isHubAlwaysVisibleSystem(s)),
    [systems]
  );

  const apiFetch = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      let message = typeof body.message === "string" ? body.message : "Erro na requisição";
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        const detail = body.errors.map((x) => String(x)).join(". ");
        message = message === "Erro na requisição" ? detail : `${message} ${detail}`;
      }
      const details = body.details as { fieldErrors?: Record<string, string[] | string> } | undefined;
      if (details?.fieldErrors && typeof details.fieldErrors === "object") {
        const parts = Object.entries(details.fieldErrors).flatMap(([field, v]) => {
          const msgs = Array.isArray(v) ? v : [String(v)];
          return msgs.map((m) => `${field}: ${m}`);
        });
        if (parts.length > 0) {
          message = `${message} (${parts.join("; ")})`;
        }
      }
      const err = new Error(message) as ApiRequestError;
      err.status = res.status;
      throw err;
    }
    if (res.status === 204) return null as T;
    return res.json() as Promise<T>;
  }, [apiUrl, token]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoints = [
        "/admin/users",
        "/admin/users?all=true&includeInactive=true&page=1&limit=1000",
        "/users",
      ];

      const pickUsers = (payload: AdminUsersApiResponse): AdminUser[] => {
        if (Array.isArray(payload)) return payload;
        const nestedData = Array.isArray(payload.data) ? null : payload.data;
        const dataArray = Array.isArray(payload.data) ? payload.data : [];
        return (
          payload.users ||
          payload.items ||
          payload.rows ||
          payload.results ||
          dataArray ||
          nestedData?.users ||
          nestedData?.items ||
          nestedData?.rows ||
          nestedData?.results ||
          []
        );
      };

      const pickSystems = (payload: AdminUsersApiResponse): SystemKey[] => {
        if (Array.isArray(payload)) return DASHBOARD_SYSTEMS;
        const nestedData = Array.isArray(payload.data) ? null : payload.data;
        const raw =
          payload.availableSystems ||
          payload.systems ||
          nestedData?.availableSystems ||
          nestedData?.systems ||
          DASHBOARD_SYSTEMS;
        const normalized = raw
          .map((s) => normalizeSystemKeyFromApi(String(s)))
          .filter((s): s is SystemKey => s !== null);
        return normalized.length > 0 ? Array.from(new Set(normalized)) : DASHBOARD_SYSTEMS;
      };

      let lastPayload: AdminUsersApiResponse | null = null;
      let lastError: ApiRequestError | null = null;
      let resolvedUsers: AdminUser[] = [];
      let resolvedSystems: SystemKey[] = DASHBOARD_SYSTEMS;

      for (const endpoint of endpoints) {
        try {
          const payload = await apiFetch<AdminUsersApiResponse>(endpoint);
          lastPayload = payload;
          const currentUsers = pickUsers(payload);
          const currentSystems = pickSystems(payload);
          if (currentSystems.length > 0) resolvedSystems = currentSystems;
          if (currentUsers.length > 0) {
            resolvedUsers = currentUsers;
            break;
          }
          if (resolvedUsers.length === 0) {
            resolvedUsers = currentUsers;
          }
        } catch (error) {
          const err = error as ApiRequestError;
          lastError = err;
          const status = err.status;

          // Se o backend disser que não tem permissão/admin, não adianta tentar endpoints alternativos.
          if (endpoint.startsWith("/admin/users") && (status === 401 || status === 403)) {
            throw err;
          }

          // Em erro de servidor, interrompe e mostra erro real.
          if (status && status >= 500) {
            throw err;
          }

          // Em 404 ou outros erros não fatais, tenta próximo endpoint.
        }
      }

      if (resolvedUsers.length === 0 && !lastPayload) {
        if (lastError?.status === 404) {
          throw new Error("Backend sem rota de listagem de usuários (/admin/users).");
        }
        if (lastError) {
          throw lastError;
        }
        throw new Error("Não foi possível consultar a lista de usuários no backend.");
      }

      setUsers(resolvedUsers.map(normalizeAdminUserFromApi));
      const mergedSystems = Array.from(new Set<SystemKey>([...DASHBOARD_SYSTEMS, ...resolvedSystems]));
      setSystems(mergedSystems);
      setBackendSystems(resolvedSystems);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, token]);

  useEffect(() => {
    if (isAdmin) void loadUsers();
  }, [isAdmin, loadUsers]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    const systemsAssignable = u.systems.filter((k) => !isHubAlwaysVisibleSystem(k));
    const initialPermissions: Partial<Record<SystemKey, SystemScopePermission>> = {};
    for (const systemKey of systemsAssignable) {
      initialPermissions[systemKey] =
        u.systemPermissions?.[systemKey] || "editor";
    }
    setEditing(u);
    setForm({
      email: u.email,
      fullName: u.fullName,
      password: "",
      role: u.role,
      isActive: u.isActive,
      systems: [...systemsAssignable],
      systemPermissions: initialPermissions,
    });
    setModalOpen(true);
  };

  const getSystemAccessLevel = (key: SystemKey): SystemAccessLevel => {
    if (!form.systems.includes(key)) return "inactive";
    return form.systemPermissions[key] || "editor";
  };

  const setSystemAccessLevel = (key: SystemKey, level: SystemAccessLevel) => {
    setForm((prev) => {
      const hasSystem = prev.systems.includes(key);
      const nextSystems = hasSystem ? [...prev.systems] : [...prev.systems, key];
      const nextPermissions = { ...prev.systemPermissions };

      if (level === "inactive") {
        delete nextPermissions[key];
        return {
          ...prev,
          systems: prev.systems.filter((x) => x !== key),
          systemPermissions: nextPermissions,
        };
      }

      if (!hasSystem) nextSystems.push(key);
      nextPermissions[key] = level;

      return {
        ...prev,
        systems: Array.from(new Set(nextSystems)),
        systemPermissions: nextPermissions,
      };
    });
  };

  const handleSave = async () => {
    if (!canSubmit || !token) return;
    setSubmitting(true);
    try {
      /** União hub + API: inclui módulos declarados no back além da lista fixa do hub. */
      const supportedSystems = Array.from(
        new Set<SystemKey>([...DASHBOARD_SYSTEMS, ...backendSystems])
      );
      const systemsToSave = form.systems
        .filter((key) => supportedSystems.includes(key))
        .filter((key) => !isHubAlwaysVisibleSystem(key));
      if (systemsToSave.length !== form.systems.length) {
        toast.warning("Alguns sistemas ainda não são aceitos pelo backend e foram ignorados.");
      }
      const systemPermissionsPayload: Record<string, SystemScopePermission> = {};
      for (const key of systemsToSave) {
        systemPermissionsPayload[key] = form.systemPermissions[key] || "editor";
      }

      const baseEditBody: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        role: form.role,
        isActive: form.isActive,
        resetPasswordTo: form.password.trim() || undefined,
      };
      const baseCreateBody: Record<string, unknown> = {
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
        fullName: form.fullName.trim(),
        role: form.role,
        isActive: form.isActive,
      };

      if (editing) {
        await saveAdminUserPayloadVariants(
          apiFetch,
          `/admin/users/${encodeURIComponent(editing.id)}`,
          "PUT",
          baseEditBody,
          systemsToSave,
          systemPermissionsPayload
        );
        toast.success("Usuário atualizado");
      } else {
        await saveAdminUserPayloadVariants(
          apiFetch,
          "/admin/users",
          "POST",
          baseCreateBody,
          systemsToSave,
          systemPermissionsPayload
        );
        toast.success("Usuário criado");
      }
      setModalOpen(false);
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (!token) return;
    if (!window.confirm(`Deseja realmente excluir "${u.fullName}"?`)) return;
    try {
      await apiFetch(`/admin/users/${encodeURIComponent(u.id)}`, {
        method: "DELETE",
      });
      toast.success("Usuário excluído");
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir");
    }
  };

  return (
    <div className="min-h-screen min-w-0 bg-background">
      <Sidebar />
      <main
        className="relative min-h-screen min-w-0 transition-all duration-150"
        style={{
          marginLeft: `${effectiveMainOffset}px`,
          width: `calc(100% - ${effectiveMainOffset}px)`,
        }}
      >
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-4 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">Administração de usuários</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Cadastro, status, perfil e acessos por sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setMobileMenuOpen(true)} className="lg:hidden">
              Menu
            </Button>
            <Button onClick={openCreate}>Novo usuário</Button>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-8">
          <div className="rounded-lg border bg-card">
            <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-4">Usuário</div>
              <div className="col-span-2">Perfil</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Sistemas</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <div className="col-span-4">
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={u.isActive ? "default" : "outline"}>
                      {u.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="col-span-3 flex flex-wrap gap-1">
                    {(() => {
                      const rowSystems = u.systems.filter((s) => !isHubAlwaysVisibleSystem(s));
                      return rowSystems.length > 0 ? (
                        rowSystems.map((s) => (
                          <Badge key={s} variant="outline">
                            {SYSTEM_LABELS[s] || s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem acesso</span>
                      );
                    })()}
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(u)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              Defina perfil, status e quais sistemas este usuário pode acessar. A Consulta Simples
              Nacional fica disponível para todos no hub e não é configurada aqui.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {!editing && (
              <div className="space-y-1">
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Nome completo</label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Perfil</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isActive: e.target.value === "active" }))
                  }
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                {editing ? "Resetar senha (opcional)" : "Senha inicial"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder={editing ? "Deixe vazio para manter" : "Mínimo 8 caracteres"}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sistemas liberados</label>
              <div className="space-y-2">
                {systemsInAuthModal.map((s) => (
                  <div key={s} className="grid grid-cols-2 items-center gap-2">
                    <span className="text-xs text-muted-foreground">{SYSTEM_LABELS[s] || s}</span>
                    <select
                      className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                      value={getSystemAccessLevel(s)}
                      onChange={(e) => setSystemAccessLevel(s, e.target.value as SystemAccessLevel)}
                    >
                      <option value="inactive">Inativo</option>
                      <option value="viewer">Visualizador</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!canSubmit || submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <SidebarProvider>
      <AdminUsersContent />
    </SidebarProvider>
  );
}
