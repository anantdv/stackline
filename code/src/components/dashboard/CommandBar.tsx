/**
 * Dashboard §1 — Command Header: hero strip + sticky command bar.
 * LIVE IST clock · 24H/7D/30D window selector · auto-refresh cadence ring ·
 * manual refresh (≥0.6s spinner, ✓ SYNCED flash) · ErpPriceBadge · guide FAB.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars } from "@/components/SplitText";
import ErpPriceBadge from "@/components/valuation/ErpPriceBadge";
import { startTour } from "@/components/guide/tours";
import { cn } from "@/lib/utils";
import type { DashWindow } from "./demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function istTime(d: Date): string {
  return (
    d.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " IST"
  );
}

/** Ticking IST clock (1s, client-side — pauses rendering cost when hidden). */
export function useIstClock(active = true): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return istTime(now);
}

/* ------------------------------------------------------------------ */
/* 1a — Hero strip                                                    */
/* ------------------------------------------------------------------ */

export function HeroStrip() {
  return (
    <section className="relative overflow-hidden bg-void">
      <div className="relative mx-auto w-full max-w-[1280px] px-6 pb-12 pt-[120px]">
        <SectionKicker>GLOBAL.VISIBILITY</SectionKicker>
        <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[56px]">
          <SplitChars
            segments={[
              { text: "The whole network. One screen. " },
              { text: "Right now.", accent: true },
            ]}
            stagger={0.05}
          />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
          className="mt-6 max-w-[560px] text-base leading-relaxed text-ink1"
        >
          Every warehouse, vehicle, gate lane, scan record and rupee of stock —
          streamed into one live surface. Spot the exception before it becomes
          a phone call.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: EASE }}
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink2"
        >
          3 LOCATIONS · 4 WAREHOUSES · 8 VEHICLES · LIVE SINCE 06:00 IST
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 1b — Command bar (sticky)                                          */
/* ------------------------------------------------------------------ */

const WINDOWS: { key: DashWindow; label: string }[] = [
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
];

/** Hairline cadence ring that sweeps once per auto-refresh cycle (30s). */
function CadenceRing({ running, cycleMs }: { running: boolean; cycleMs: number }) {
  const R = 9;
  const C = 2 * Math.PI * R;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const t = window.setInterval(() => {
      setProgress(((Date.now() - start) % cycleMs) / cycleMs);
    }, 250);
    return () => window.clearInterval(t);
  }, [running, cycleMs]);

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90" aria-hidden>
      <circle cx="12" cy="12" r={R} fill="none" className="stroke-linestrong" strokeWidth={1.5} />
      <circle
        cx="12" cy="12" r={R} fill="none"
        className="stroke-data"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - progress)}
        style={{ transition: "stroke-dashoffset 0.25s linear" }}
      />
    </svg>
  );
}

export function CommandBar({
  window: timeWindow,
  onWindow,
  live,
  onToggleLive,
  refreshing,
  syncedAt,
  onRefresh,
  visible,
}: {
  window: DashWindow;
  onWindow: (w: DashWindow) => void;
  live: boolean;
  onToggleLive: (live: boolean) => void;
  refreshing: boolean;
  syncedAt: Date | null;
  onRefresh: () => void;
  visible: boolean;
}) {
  const clock = useIstClock(visible);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
      className={cn(
        "sticky top-16 z-40 border-b backdrop-blur-[14px] transition-all duration-300",
        stuck
          ? "border-linestrong bg-page/75 shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
          : "border-line bg-page/60"
      )}
      data-tour="command-bar"
    >
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 overflow-x-auto px-6 md:gap-5">
        {/* LIVE clock */}
        <span
          className="group relative flex shrink-0 items-center gap-2 font-mono text-[15px] font-medium tracking-[0.06em] text-ink0 font-tnum"
          title="SYSTEM TIME · ASIA/KOLKATA"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-data opacity-60 [animation-duration:1.6s]" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-data" />
          </span>
          {clock}
        </span>

        <span className="hidden h-5 w-px bg-linestrong sm:block" aria-hidden />

        {/* Time-window selector */}
        <div
          role="group"
          aria-label="Time window"
          className="flex shrink-0 items-center rounded-md border border-line p-0.5"
        >
          {WINDOWS.map((w) => {
            const active = timeWindow === w.key;
            return (
              <button
                key={w.key}
                type="button"
                aria-pressed={active}
                onClick={() => onWindow(w.key)}
                className={cn(
                  "relative rounded px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] transition-colors duration-200",
                  active ? "text-onbrand" : "text-ink2 hover:text-ink0"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dash-window-pill"
                    className="absolute inset-0 rounded bg-brand"
                    transition={{ duration: 0.25, ease: EASE }}
                  />
                )}
                <span className="relative">{w.label}</span>
              </button>
            );
          })}
        </div>

        <span className="hidden h-5 w-px bg-linestrong md:block" aria-hidden />

        {/* Auto-refresh status */}
        <span className="hidden shrink-0 items-center gap-2 md:flex" title="Auto-refresh cadence">
          <CadenceRing running={visible && !refreshing} cycleMs={30_000} />
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink2">
            AUTO ⟳ 30S
          </span>
        </span>

        {/* Manual refresh */}
        <span className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh all dashboard data"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-linestrong text-ink1 transition-colors duration-200 hover:border-brand hover:text-brand"
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
              style={refreshing ? { animationDuration: "0.6s" } : undefined}
            />
          </button>
          {syncedAt && !refreshing && (
            <motion.span
              key={syncedAt.getTime()}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden font-mono text-[10px] tracking-[0.12em] text-data lg:block"
            >
              ✓ SYNCED {istTime(syncedAt)}
            </motion.span>
          )}
        </span>

        <span className="flex-1" aria-hidden />

        {/* ErpPriceBadge (page-level) */}
        <ErpPriceBadge live={live} onToggle={onToggleLive} className="shrink-0" />

        {/* Guide context FAB */}
        <button
          type="button"
          onClick={() => startTour("/dashboard")}
          aria-label="Start the dashboard guided tour"
          title="GUIDE ME — dashboard tour"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-linestrong font-mono text-xs font-semibold text-ink1 transition-colors duration-200 hover:border-brand hover:text-brand"
        >
          ?
        </button>
      </div>
    </motion.div>
  );
}
