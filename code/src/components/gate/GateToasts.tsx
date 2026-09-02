import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GateToast {
  id: number;
  tone: "crit" | "ok" | "info";
  title: string;
  body: string;
}

const ICONS = {
  crit: ShieldAlert,
  ok: CheckCircle2,
  info: Info,
} as const;

const FRAME = {
  crit: "border-crit/60 shadow-[0_0_28px_rgba(244,80,78,0.25)]",
  ok: "border-data/50",
  info: "border-linestrong",
} as const;

const ICON_CLS = { crit: "text-crit", ok: "text-data", info: "text-ink1" } as const;

/** Bottom-right toast stack — the red one is the EWB compliance hold. */
export default function GateToasts({
  toasts,
  onDismiss,
}: {
  toasts: GateToast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[70] flex w-[min(92vw,380px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <motion.div
              key={t.id}
              layout="position"
              initial={{ opacity: 0, x: 60, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto relative rounded-xl border bg-raised p-3.5 backdrop-blur",
                FRAME[t.tone]
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", ICON_CLS[t.tone])} />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "font-mono text-[10px] font-semibold uppercase tracking-[0.16em]",
                      ICON_CLS[t.tone]
                    )}
                  >
                    {t.title}
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-ink1">{t.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(t.id)}
                  aria-label="Dismiss"
                  className="text-ink2 transition-colors hover:text-ink0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
