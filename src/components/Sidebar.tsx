import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
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
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
}

const mainNav: NavItem[] = [
  { icon: LayoutGrid, label: "Início" },
  { icon: ScrollText, label: "Alvarás" },
  { icon: ShieldCheck, label: "Certificado Digital" },
  { icon: FileText, label: "CND's" },
  { icon: GitBranch, label: "Gestão de Processos" },
  { icon: Building2, label: "Cadastro de Empresas" },
  { icon: FileSignature, label: "Procurações" },
  { icon: AlertTriangle, label: "Situação Fiscal" },
  { icon: FileSearch, label: "Consulta Simples Nacional" },
];

const bottomNav: NavItem[] = [
  { icon: Settings, label: "Configurações" },
  { icon: HelpCircle, label: "Ajuda" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-150",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo - tamanho fixo, não encolhe quando sidebar minimiza */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center overflow-visible px-0" : "gap-3 px-5"
        )}
      >
        <img
          src={logo}
          alt="O2con"
          className="h-8 w-[120px] shrink-0 object-contain object-left"
        />
        {!collapsed && (
          <span className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
            Hub
          </span>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainNav.map((item, i) => {
          const Icon = item.icon;
          const isActive = i === activeIndex;
          return (
            <button
              key={item.label}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-primary text-primary-foreground"
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
          <p className="mb-2 text-xs font-medium text-sidebar-muted">Administrador</p>
        )}
        <div className="space-y-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
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
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
