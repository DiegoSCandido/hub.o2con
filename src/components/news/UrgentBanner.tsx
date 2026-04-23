import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface UrgentBannerProps {
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export const UrgentBanner = ({ title, message, ctaLabel, onCta }: UrgentBannerProps) => {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-urgent text-destructive-foreground shadow-elevated"
        >
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 40%)",
            }}
          />
          <div className="relative flex items-start gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Aviso Urgente</span>
                <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse-dot" />
              </div>
              <h3 className="mt-1 text-base sm:text-lg font-semibold leading-tight">{title}</h3>
              <p className="mt-1 text-sm opacity-95 leading-relaxed">{message}</p>
              {ctaLabel && onCta && (
                <button
                  type="button"
                  onClick={onCta}
                  className="mt-3 inline-flex items-center rounded-lg bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-sm font-medium backdrop-blur transition-smooth"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/20 transition-smooth"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};