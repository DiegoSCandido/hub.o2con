import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { buildSsoUrl } from "@/lib/sso";
import {
  LayoutGrid,
  ScrollText,
  ShieldCheck,
  FileText,
  GitBranch,
  Building2,
  FileSignature,
  AlertTriangle,
  FileSearch,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logo from "@/assets/logo-o2con.png";
import o2conIcon from "@/assets/o2con-icon.png";
import { cn } from "@/lib/utils";

type SystemKey =
  | "alvaras"
  | "certificados"
  | "cnds"
  | "processos"
  | "cadastro_empresas"
  | "procuracoes"
  | "fiscal"
  | "simples_nacional";

function normalizeSystemKey(value: string): SystemKey | null {
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
  };
  return alias[key] || null;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  /** Abre em nova aba (mesmo destino dos cards em Sistemas) */
  externalUrl?: string;
  sso?: boolean;
  internalPath?: string;
  systemKey?: SystemKey;
}

const mainNav: NavItem[] = [
  { icon: LayoutGrid, label: "Início", internalPath: "/dashboard" },
  { icon: ScrollText, label: "Alvarás", systemKey: "alvaras", externalUrl: "https://o2controle-gestao-alvaras.vercel.app/", sso: true },
  { icon: ShieldCheck, label: "Certificado Digital", systemKey: "certificados", externalUrl: "https://certificados-o2con.vercel.app/", sso: true },
  { icon: FileText, label: "CND's", systemKey: "cnds" },
  { icon: GitBranch, label: "Gestão de Processos", systemKey: "processos" },
  { icon: Building2, label: "Cadastro de Empresas", systemKey: "cadastro_empresas" },
  { icon: FileSignature, label: "Procurações", systemKey: "procuracoes" },
  { icon: AlertTriangle, label: "Situação Fiscal", systemKey: "fiscal" },
  { icon: FileSearch, label: "Consulta Simples Nacional", systemKey: "simples_nacional", externalUrl: "https://simples-status-checker.vercel.app/", sso: true },
];

const bottomNav: NavItem[] = [{ icon: HelpCircle, label: "Ajuda" }];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, getToken, isAuthenticated, user } = useAuth();
  const { collapsed, setCollapsed, isDesktop, mobileMenuOpen, setMobileMenuOpen } = useSidebar();
  const [activeIndex, setActiveIndex] = useState(0);

  const closeMobileIfNeeded = () => {
    if (!isDesktop) setMobileMenuOpen(false);
  };

  const openExternalSystem = (url: string, sso?: boolean) => {
    const tokenFromState = getToken();
    const tokenFromStorage =
      typeof window !== "undefined" ? localStorage.getItem("o2con_hub_token") : null;
    const token = sso && isAuthenticated ? tokenFromState || tokenFromStorage : null;
    const href = token ? buildSsoUrl(url, token) : url;
    window.open(href, "_blank", "noopener,noreferrer");
  };
  const allowedSystems = new Set(
    (user?.systems || [])
      .map((s) => normalizeSystemKey(String(s)))
      .filter((s): s is SystemKey => s !== null)
  );

  const mainNavItems: NavItem[] =
    user?.role === "admin"
      ? [...mainNav, { icon: Settings, label: "Administração", internalPath: "/admin/users" }]
      : mainNav.filter((item) => {
          if (!item.systemKey) return true;
          return allowedSystems.has(item.systemKey);
        });

  return (
    <>
      {!isDesktop && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar duration-150",
          "transition-[transform,width]",
          collapsed ? "w-[72px]" : "w-[260px]",
          isDesktop ? "translate-x-0" : mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo completa (expandido) ou apenas ícone (minimizado) — como no alvarás */}
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border px-3">
        {collapsed ? (
          <img
            src={o2conIcon}
            alt="O2con"
            className="h-9 w-9 shrink-0 object-contain object-center"
          />
        ) : (
          <img
            src={logo}
            alt="O2con"
            className="h-8 w-auto max-w-[min(200px,calc(100%-0.5rem))] shrink-0 object-contain object-center"
          />
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainNavItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = item.internalPath
            ? location.pathname === item.internalPath
            : i === activeIndex;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.externalUrl) {
                  openExternalSystem(item.externalUrl, item.sso);
                  closeMobileIfNeeded();
                  return;
                }
                if (item.internalPath) {
                  navigate(item.internalPath);
                  closeMobileIfNeeded();
                  return;
                }
                setActiveIndex(i);
                closeMobileIfNeeded();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-opacity duration-150",
                isActive
                  ? "brand-gradient text-white shadow-glow-primary hover:opacity-90"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-5 py-3">
            {!collapsed && (
          <p className="mb-2 truncate text-xs font-medium text-sidebar-muted">
            {user?.name || user?.email || "Usuário"}
          </p>
        )}
        <div className="space-y-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={closeMobileIfNeeded}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
              closeMobileIfNeeded();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-sidebar-accent"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-150 hover:text-foreground lg:flex"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
    </>
  );
}
