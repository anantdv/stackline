import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Deterministic PRNG so a pass number always draws the same QR pattern. */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

/** Faux-QR block: 17×17 module grid with finder squares. Re-shuffles modules on `reshuffle`. */
export function QrBlock({
  seed,
  size = 96,
  reshuffle = 0,
  className,
}: {
  seed: string;
  size?: number;
  reshuffle?: number;
  className?: string;
}) {
  const cells = useMemo(() => {
    const rnd = seededRandom(seed + ":" + reshuffle);
    const n = 17;
    const out: { x: number; y: number; on: boolean }[] = [];
    const finder = (x: number, y: number) =>
      (x < 5 && y < 5) || (x >= n - 5 && y < 5) || (x < 5 && y >= n - 5);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (finder(x, y)) {
          const fx = x < 5 ? x : x - (n - 5);
          const fy = y < 5 ? y : y - (n - 5);
          const on =
            fx === 0 || fy === 0 || fx === 4 || fy === 4 || (fx === 2 && fy === 2);
          out.push({ x, y, on });
        } else {
          out.push({ x, y, on: rnd() > 0.52 });
        }
      }
    }
    return out;
  }, [seed, reshuffle]);
  const m = size / 17;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width={size} height={size} className="fill-page" />
      {cells.map(
        (c, i) =>
          c.on && (
            <motion.rect
              key={i}
              x={c.x * m + 0.4}
              y={c.y * m + 0.4}
              width={m - 0.8}
              height={m - 0.8}
              className="fill-ink0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (c.x + c.y) * 0.008, duration: 0.2 }}
            />
          )
      )}
    </svg>
  );
}

export type StampTone = "brand" | "data" | "crit" | "ink";

const STAMP_CLS: Record<StampTone, string> = {
  brand: "border-brand text-brand",
  data: "border-data text-data",
  crit: "border-crit text-crit",
  ink: "border-ink2 text-ink2",
};

/** Rubber-stamp overlay: pops in with a scale 1.3→1 + slight rotate. */
export function RubberStamp({
  text,
  tone = "brand",
  stampKey,
  className,
}: {
  text: string;
  tone?: StampTone;
  /** change to retrigger the pop animation */
  stampKey?: string | number;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={stampKey ?? text}
        initial={{ scale: 1.3, opacity: 0, rotate: -14 }}
        animate={{ scale: 1, opacity: 1, rotate: -8 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.3, 0.7, 0.3, 1] }}
        className={cn(
          "pointer-events-none inline-block rounded border-2 px-2.5 py-1",
          "font-mono text-[11px] font-semibold uppercase tracking-[0.2em]",
          "shadow-[inset_0_0_0_1px_currentColor] opacity-90",
          STAMP_CLS[tone],
          className
        )}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}

export interface PassChecklistItem {
  label: string;
  done: boolean;
}

/**
 * GatePassCard (design-delta §4.8): BlueprintCard variant styled like a
 * printed gate pass — mono header, QR block, vehicle/driver row, checklist
 * ticks, dashed tear-line divider, rubber-stamp status.
 */
export default function GatePassCard({
  passNo,
  plate,
  driver,
  dock,
  checklist,
  stamp,
  stampTone = "brand",
  stampKey,
  footer,
  qrReshuffle = false,
  mini = false,
  className,
}: {
  passNo: string;
  plate: string;
  driver: string;
  dock?: string | null;
  checklist?: PassChecklistItem[];
  stamp?: string | null;
  stampTone?: StampTone;
  stampKey?: string | number;
  footer?: string | null;
  /** re-assemble the QR pattern every 5s (hero mini) */
  qrReshuffle?: boolean;
  mini?: boolean;
  className?: string;
}) {
  const [reshuffle, setReshuffle] = useState(0);
  useEffect(() => {
    if (!qrReshuffle) return;
    const t = window.setInterval(() => setReshuffle((v) => v + 1), 5000);
    return () => window.clearInterval(t);
  }, [qrReshuffle]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-linestrong bg-surface",
        "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      {/* perforation nubs */}
      <span aria-hidden className="absolute -left-1.5 top-1/2 h-3 w-3 rounded-full bg-void" />
      <span aria-hidden className="absolute -right-1.5 top-1/2 h-3 w-3 rounded-full bg-void" />

      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink0">
          GATE PASS <span className="text-brand">#{passNo}</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
          WH-MUM-01
        </span>
      </div>

      {/* body */}
      <div className={cn("flex gap-4 px-4", mini ? "py-3" : "py-4")}>
        <QrBlock seed={passNo} reshuffle={reshuffle} size={mini ? 72 : 96} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-mono text-[13px] font-semibold tracking-[0.06em] text-ink0">
              {plate}
            </span>
            {dock && (
              <span className="rounded border border-data/40 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-data">
                DOCK {dock}
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">
            DRIVER · {driver}
          </span>
          {checklist && checklist.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1">
              {checklist.map((c, i) => (
                <li
                  key={c.label}
                  className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em]"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.12, duration: 0.2 }}
                    className={cn(
                      "flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border",
                      c.done ? "border-data bg-data/15 text-data" : "border-line text-transparent"
                    )}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </motion.span>
                  <span className={c.done ? "text-ink1" : "text-ink2"}>{c.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* dashed tear-line */}
      <div aria-hidden className="mx-2 border-t border-dashed border-linestrong" />

      {/* stub */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
          {footer ?? "SCAN AT BOOTH · KEEP WITH DRIVER"}
        </span>
        {stamp && (
          <RubberStamp text={stamp} tone={stampTone} stampKey={stampKey} />
        )}
      </div>
    </div>
  );
}
