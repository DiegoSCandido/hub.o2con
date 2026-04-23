import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NewsCard, type NewsItem } from "./NewsCard";
import { UrgentBanner } from "./UrgentBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isItemUnread, useMarkNewsRead, useNewsLatest, useNewsUrgent } from "@/hooks/useNews";

export const NewsSection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const latestQuery = useNewsLatest(4);
  const urgentQuery = useNewsUrgent();
  const markRead = useMarkNewsRead();

  const contentBlocks = useMemo(() => {
    const raw = selected?.content?.trim();
    if (!raw) return [];
    return raw.split(/\n{2,}/g).map((b) => b.trim()).filter(Boolean);
  }, [selected?.content]);

  return (
    <section aria-labelledby="news-title" className="space-y-4">
      {urgentQuery.data?.item && (
        <UrgentBanner
          title={urgentQuery.data.item.title}
          message={urgentQuery.data.item.summary}
          ctaLabel="Ver detalhes"
          onCta={() => {
            const item = urgentQuery.data?.item;
            if (!item) return;
            if (isItemUnread(item)) markRead.mutate(item.id);
            setSelected(item);
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between gap-4 pt-2"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white shadow-glow-primary">
              <Bell className="h-4 w-4" />
            </span>
            <h2 id="news-title" className="text-xl font-semibold tracking-tight text-foreground">
              Notícias e Avisos
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualizações da plataforma, comunicados e novidades para sua equipe
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard/noticias")}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-glow transition-smooth"
        >
          Ver todas
          <ChevronRight className="h-4 w-4" />
        </button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(latestQuery.data?.items || []).map((item, i) => (
          <NewsCard
            key={item.id}
            item={item}
            index={i}
            onOpen={(opened) => {
              if (isItemUnread(opened)) markRead.mutate(opened.id);
              setSelected(opened);
            }}
          />
        ))}
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
                <p className="text-sm text-muted-foreground">{selected?.date}</p>
              </DialogHeader>

              {selected?.summary && (
                <p className="mt-4 text-base text-foreground/90 leading-relaxed">
                  {selected.summary}
                </p>
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
    </section>
  );
};