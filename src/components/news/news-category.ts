import { type LucideIcon, Megaphone, RefreshCw, Sparkles, Wrench } from "lucide-react";

export type NewsCategory = "novidade" | "aviso" | "manutencao" | "atualizacao";

export const NEWS_CATEGORY_META: Record<
  NewsCategory,
  { label: string; icon: LucideIcon; classes: string; dot: string }
> = {
  novidade: {
    label: "Novidade",
    icon: Sparkles,
    classes: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  aviso: {
    label: "Aviso",
    icon: Megaphone,
    classes: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  manutencao: {
    label: "Manutenção",
    icon: Wrench,
    classes: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  atualizacao: {
    label: "Atualização",
    icon: RefreshCw,
    classes: "bg-info/10 text-info border-info/20",
    dot: "bg-info",
  },
};

