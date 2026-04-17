import { type LucideIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExternalPlatformCardProps {
  title: string;
  description: string;
  href: string;
  /** Caminho público, ex.: `/external-logos/foo.png` */
  logoSrc?: string;
  /** Quando não há logo (ex.: link placeholder) */
  fallbackIcon?: LucideIcon;
}

export function ExternalPlatformCard({
  title,
  description,
  href,
  logoSrc,
  fallbackIcon: FallbackIcon,
}: ExternalPlatformCardProps) {
  const frame = (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/90 p-2",
        "bg-gradient-to-br from-muted/90 to-muted/50 shadow-sm ring-1 ring-border/60",
        "transition-[box-shadow,border-color,background-color] duration-150",
        "group-hover:border-primary/40 group-hover:from-primary/[0.08] group-hover:to-muted/55 group-hover:ring-primary/15",
        "dark:from-muted/50 dark:to-muted/25 dark:ring-white/10 dark:group-hover:from-primary/[0.12] dark:group-hover:ring-primary/25"
      )}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 object-contain opacity-90 transition-opacity duration-150 group-hover:opacity-100"
          loading="lazy"
          decoding="async"
        />
      ) : FallbackIcon ? (
        <FallbackIcon className="h-7 w-7 text-primary" strokeWidth={1.5} aria-hidden />
      ) : (
        <span className="font-display text-lg font-semibold text-primary" aria-hidden>
          {title.charAt(0)}
        </span>
      )}
    </div>
  );

  const isPlaceholder = href === "#";

  const body = (
    <>
      {frame}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-semibold text-card-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {!isPlaceholder && (
        <ExternalLink
          className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-primary"
          strokeWidth={1.5}
          aria-hidden
        />
      )}
    </>
  );

  const className = cn(
    "group flex items-center gap-4 rounded-lg border border-border bg-card p-5 sm:p-6",
    "transition-colors duration-150 hover:border-primary"
  );

  if (isPlaceholder) {
    return (
      <div className={cn(className, "cursor-default opacity-90")}>
        {body}
      </div>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  );
}
