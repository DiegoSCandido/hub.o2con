import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { buildSsoUrl } from "@/lib/sso";

interface AppCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: "online" | "offline" | "maintenance";
  url?: string;
  /** Se true, passa o token do Hub para login automático no app (apps internos com mesmo backend) */
  sso?: boolean;
}

export default function AppCard({ icon: Icon, title, description, status = "online", url, sso = false }: AppCardProps) {
  const { getToken, isAuthenticated } = useAuth();
  const statusLabel = {
    online: "Ativo",
    offline: "Inativo",
    maintenance: "Manutenção",
  };

  const cardClass = "group flex aspect-[3/2] cursor-pointer flex-col justify-between rounded-md border border-border bg-card p-6 transition-colors duration-150 hover:border-primary";

  const cardContent = (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Icon
            className={cn(
              "h-6 w-6 transition-colors duration-150",
              "text-muted-foreground group-hover:text-primary"
            )}
            strokeWidth={1.5}
          />
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              status === "online" && "bg-[hsl(var(--status-online))]",
              status === "offline" && "bg-muted-foreground",
              status === "maintenance" && "bg-[hsl(var(--status-maintenance))]"
            )}
            title={statusLabel[status]}
          />
        </div>
        <h3 className="font-display text-base font-semibold text-card-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{statusLabel[status]}</span>
      </div>
    </>
  );

  if (url) {
    // SSO: passa token para login automático nos apps internos
    // Usa localStorage como fallback (evita timing do estado React)
    const tokenFromState = getToken();
    const tokenFromStorage = typeof window !== "undefined" ? localStorage.getItem("o2con_hub_token") : null;
    const token = sso && isAuthenticated ? (tokenFromState || tokenFromStorage) : null;
    const href = token ? buildSsoUrl(url, token) : url;

    const handleClick = (e: React.MouseEvent) => {
      if (token) {
        e.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }
    };

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cardClass} onClick={handleClick}>
        {cardContent}
      </a>
    );
  }

  return <div className={cardClass}>{cardContent}</div>;
}
