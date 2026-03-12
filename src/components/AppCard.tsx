import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: "online" | "offline" | "maintenance";
}

export default function AppCard({ icon: Icon, title, description, status = "online" }: AppCardProps) {
  const statusLabel = {
    online: "Ativo",
    offline: "Inativo",
    maintenance: "Manutenção",
  };

  return (
    <div className="group flex aspect-[3/2] cursor-pointer flex-col justify-between rounded-md border border-border bg-card p-6 transition-colors duration-150 hover:border-primary">
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
    </div>
  );
}
