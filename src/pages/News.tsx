import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, ChevronLeft, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { type NewsItem } from "@/components/news/NewsCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NEWS_CATEGORY_META } from "@/components/news/news-category";
import loginBg from "@/assets/login-bg.jpg";
import { formatNewsDate } from "@/lib/news-date";
import { isItemUnread, useMarkNewsRead, useNewsPage } from "@/hooks/useNews";

const PAGE_SIZE = 10;

function NewsContent() {
  const navigate = useNavigate();
  const { effectiveMainOffset, setMobileMenuOpen } = useSidebar();
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement | null>(null);
  const pageQuery = useNewsPage(page, PAGE_SIZE);
  const markRead = useMarkNewsRead();

  const pageCount = pageQuery.data?.pageCount || 1;
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const pageItems = pageQuery.data?.items || [];

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const contentBlocks = useMemo(() => {
    const raw = selected?.content?.trim();
    if (!raw) return [];
    return raw.split(/\n{2,}/g).map((b) => b.trim()).filter(Boolean);
  }, [selected?.content]);

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
        <div
          className="fixed top-0 right-0 bottom-0 z-0 bg-cover bg-center bg-no-repeat opacity-[.2] dark:opacity-[0.06]"
          style={{
            left: `${effectiveMainOffset}px`,
            backgroundImage: `url(${loginBg})`,
            backgroundAttachment: "fixed",
          }}
          aria-hidden
        />
        <div
          className="fixed top-0 right-0 bottom-0 z-0 bg-background/70 dark:bg-background/80"
          style={{ left: `${effectiveMainOffset}px` }}
          aria-hidden
        />

        <div className="relative z-10">
        <header className="sticky top-0 z-40 flex h-16 min-w-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold sm:text-base">Notícias e Avisos</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Comunicados, atualizações e manutenção — mais novo primeiro
              </p>
            </div>
          </div>
        </header>

        <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
          <div ref={topRef} />

          <div className="w-full max-w-6xl xl:max-w-7xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="divide-y divide-border">
                {pageItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isItemUnread(item)) markRead.mutate(item.id);
                      setSelected(item);
                    }}
                    className="group flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {item.imageSrc ? (
                        <img
                          src={item.imageSrc}
                          alt={item.imageAlt || ""}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Bell className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const meta = NEWS_CATEGORY_META[item.category];
                          const Icon = meta.icon;
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                                meta.classes
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </span>
                          );
                        })()}
                        {isItemUnread(item) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                            NOVO
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatNewsDate(item.publishedAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {pageCount > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-start gap-2">
                {Array.from({ length: pageCount }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={
                      p === currentPage
                        ? "h-9 min-w-9 rounded-lg brand-gradient px-3 text-sm font-semibold text-white shadow-glow-primary"
                        : "h-9 min-w-9 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                    }
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="w-[min(100vw-2rem,64rem)] max-w-none p-0 overflow-hidden">
            <div className="max-h-[85vh] overflow-y-auto">
              {selected?.imageSrc && (
                <div className="relative aspect-[21/9] w-full bg-muted">
                  <img
                    src={selected.imageSrc}
                    alt={selected.imageAlt || ""}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="p-6 sm:p-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-2xl sm:text-3xl">{selected?.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{formatNewsDate(selected?.publishedAt)}</p>
                </DialogHeader>

                {selected?.summary && (
                  <p className="mt-4 text-base text-foreground/90 leading-relaxed">{selected.summary}</p>
                )}

                {contentBlocks.length > 0 && (
                  <div className="mt-5 space-y-3 text-sm sm:text-base text-foreground/90 leading-relaxed">
                    {contentBlocks.map((block, idx) => (
                      <p key={idx} className="whitespace-pre-line">
                        {block}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </main>
    </div>
  );
}

export default function NewsPage() {
  return (
    <SidebarProvider>
      <NewsContent />
    </SidebarProvider>
  );
}

