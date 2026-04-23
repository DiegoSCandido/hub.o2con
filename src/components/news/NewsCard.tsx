import { motion } from "framer-motion";
import { ArrowUpRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { NEWS_CATEGORY_META, type NewsCategory } from "./news-category";
import { formatNewsDate } from "@/lib/news-date";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  date?: string; // human readable (fallback)
  publishedAt?: string; // ISO string (used for ordering)
  isUrgent?: boolean;
  isNew?: boolean;
  unread?: boolean;
  content?: string;
  imageSrc?: string;
  imageAlt?: string;
}

interface NewsCardProps {
  item: NewsItem;
  index?: number;
  onOpen?: (item: NewsItem) => void;
  unread?: boolean;
}

export const NewsCard = ({ item, index = 0, onOpen, unread }: NewsCardProps) => {
  const meta = NEWS_CATEGORY_META[item.category];
  const Icon = meta.icon;
  const interactive = Boolean(onOpen);
  const showNew = unread ?? item.unread ?? Boolean(item.isNew);
  const dateLabel = formatNewsDate(item.publishedAt) || item.date || "";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3 }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpen?.(item) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onOpen?.(item);
            }
          : undefined
      }
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors duration-150 hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
          meta.classes,
        )}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        {showNew && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
            NOVO
          </span>
        )}
      </div>

      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-smooth">
        {item.title}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
        {item.summary}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {dateLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-smooth">
          Ler mais
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.article>
  );
};