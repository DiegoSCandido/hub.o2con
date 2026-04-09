import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserRole = "admin" | "user";
type PermissionLevel = "viewer" | "editor" | "admin";
type SystemAccessLevel = PermissionLevel | "inactive";
type SystemKey =
  | "alvaras"
  | "certificados"
  | "cnds"
  | "processos"
  | "cadastro_empresas"
  | "procuracoes"
  | "fiscal"
  | "simples_nacional";

const DASHBOARD_SYSTEMS: SystemKey[] = [
  "alvaras",
  "certificados",
  "cnds",
  "processos",
  "cadastro_empresas",
  "procuracoes",
  "fiscal",
  "simples_nacional",
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

const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  viewer: "Visualizador",
  editor: "Editor",
  admin: "Administrador",
};

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  systems: SystemKey[];
  systemPermissions?: Partial<Record<SystemKey, PermissionLevel>>;
  createdAt: string;
  updatedAt: string;
};

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
  systemPermissions: Partial<Record<SystemKey, PermissionLevel>>;
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
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message || "Erro na requisição") as ApiRequestError;
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
        "/admin/users?all=true&includeInactive=true&page=1&limit=1000",
        "/admin/users",
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
        return (
          payload.availableSystems ||
          payload.systems ||
          nestedData?.availableSystems ||
          nestedData?.systems ||
          DASHBOARD_SYSTEMS
        );
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

      setUsers(resolvedUsers);
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
    const initialPermissions: Partial<Record<SystemKey, PermissionLevel>> = {};
    for (const systemKey of u.systems) {
      initialPermissions[systemKey] = u.systemPermissions?.[systemKey] || "editor";
    }
    setEditing(u);
    setForm({
      email: u.email,
      fullName: u.fullName,
      password: "",
      role: u.role,
      isActive: u.isActive,
      systems: [...u.systems],
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
      const supportedSystems = backendSystems.length > 0 ? backendSystems : DASHBOARD_SYSTEMS;
      const systemsToSave = form.systems.filter((key) => supportedSystems.includes(key));
      if (systemsToSave.length !== form.systems.length) {
        toast.warning("Alguns sistemas ainda não são aceitos pelo backend e foram ignorados.");
      }
      const systemsPayload = systemsToSave.map((key) => ({
        key,
        level: form.systemPermissions[key] || "editor",
      }));

      if (editing) {
        await apiFetch(`/admin/users/${encodeURIComponent(editing.id)}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            role: form.role,
            isActive: form.isActive,
            systems: systemsPayload,
            resetPasswordTo: form.password.trim() || undefined,
          }),
        });
        toast.success("Usuário atualizado");
      } else {
        await apiFetch("/admin/users", {
          method: "POST",
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            password: form.password.trim(),
            fullName: form.fullName.trim(),
            role: form.role,
            isActive: form.isActive,
            systems: systemsPayload,
          }),
        });
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
                    {u.systems.length > 0 ? (
                      u.systems.map((s) => (
                        <Badge key={s} variant="outline">
                          {SYSTEM_LABELS[s] || s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem acesso</span>
                    )}
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
                {systems.map((s) => (
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
                      <option value="admin">Administrador</option>
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
