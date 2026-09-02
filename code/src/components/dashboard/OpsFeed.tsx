/**
 * Dashboard §3b — Unified Operations Feed: streaming event log with 7-type
 * color map, multi-select filter chips (GPS off by default), pause-on-hover,
 * 200-event buffer, teal flash on new rows, 60s heat decay.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router";
import { Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  nextFeedEvent,
  type DashWindow,
  type FeedEvent,
  type FeedType,
} from "./demo";
import type { DashboardData } from "./useDashboardData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const BUFFER_CAP = 200;
const INITIAL_RENDER = 60;

const TYPES: FeedType[] = ["PUTAWAY", "GATE", "GPS", "EWB", "SCAN", "TRANSFER"];

/** 7-type color map (hard spec §3b). */
const TYPE_STYLE: Record<FeedType, { chip: string; text: string }> = {
  PUTAWAY: { chip: "border-data/40 bg-data-soft text-data", text: "text-data" },
  GATE: { chip: "border-brand/40 bg-brand-soft text-brand", text: "text-brand" },
  GPS: { chip: "border-line bg-raised text-ink2", text: "text-ink2" },
  EWB: { chip: "border-warn/40 bg-warn/10 text-warn", text: "text-warn" },
  SCAN: { chip: "border-data/40 bg-data-soft text-data", text: "text-data" },
  TRANSFER: { chip: "border-data/40 bg-data-soft text-data", text: "text-data" },
  SYNC: { chip: "border-line bg-raised text-ink2", text: "text-ink2" },
};

function chipTone(e: FeedEvent): string {
  if (e.type === "EWB" && e.tone === "crit") return "border-crit/40 bg-crit/10 text-crit";
  if (e.type === "SCAN") {
    if (e.tone === "crit") return "border-crit/40 bg-crit/10 text-crit";
    if (e.tone === "warn") return "border-warn/40 bg-warn/10 text-warn";
  }
  return TYPE_STYLE[e.type].chip;
}

function tsOf(at: number): string {
  return new Date(at).toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });
}

function FeedRow({ event, fresh }: { event: FeedEvent; fresh: boolean }) {
  const old = Date.now() - event.at > 60_000;
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: EASE, layout: { type: "spring", stiffness: 300, damping: 30 } }}
      className={cn(
        "flex h-11 items-center gap-2 border-b border-line/60 px-3 font-mono text-[12px] transition-[filter,opacity] duration-700",
        fresh && "animate-none",
        old && "opacity-[0.85] saturate-[0.85]"
      )}
      style={fresh ? { animation: "ticker-flash 0.8s ease-out" } : undefined}
    >
      <span className="shrink-0 text-ink2 font-tnum">{tsOf(event.at)}</span>
      <span
        className={cn(
          "shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.1em]",
          chipTone(event)
        )}
      >
        {event.type}
      </span>
      <span className="min-w-0 flex-1 truncate text-ink1">{event.message}</span>
      <span className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-ink2 sm:block">
        {event.location}
      </span>
      {event.doc && (
        <Link
          to={event.href}
          className="hidden shrink-0 text-[10px] text-ink2 underline decoration-line underline-offset-2 transition-colors hover:text-brand md:block"
        >
          {event.doc}
        </Link>
      )}
    </motion.div>
  );
}

export default function OpsFeed({
  data,
  window: timeWindow,
}: {
  data: DashboardData;
  window: DashWindow;
}) {
  const reduced = useReducedMotion();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [filters, setFilters] = useState<Set<FeedType>>(
    () => new Set(["PUTAWAY", "GATE", "EWB", "SCAN", "TRANSFER"]) // GPS + SYNC off by default (noisy)
  );
  const [paused, setPaused] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [showCount, setShowCount] = useState(INITIAL_RENDER);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<FeedEvent[]>([]);

  /* Seed: live-derived events when available, else the demo seed buffer. */
  useEffect(() => {
    const base = data.feedLive ?? data.feedSeed;
    setEvents(base.slice(0, BUFFER_CAP));
    // only reseed when the source identity changes (live ↔ demo)
  }, [data.feedLive == null]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Demo emitter (§3b fallback generator): one event every 4–8s. */
  useEffect(() => {
    if (!data.feedDemo || !data.visible) return;
    let timer = 0;
    const push = () => {
      const ev = nextFeedEvent(Date.now());
      if (paused) queueRef.current.push(ev);
      else {
        setEvents((prev) => [ev, ...prev].slice(0, BUFFER_CAP));
        setFreshIds((prev) => new Set(prev).add(ev.id));
        window.setTimeout(
          () => setFreshIds((prev) => { const n = new Set(prev); n.delete(ev.id); return n; }),
          900
        );
      }
      timer = window.setTimeout(push, 4000 + Math.random() * 4000);
    };
    timer = window.setTimeout(push, 4000 + Math.random() * 4000);
    return () => window.clearTimeout(timer);
  }, [data.feedDemo, data.visible, paused]);

  /* Flush queued events when unpausing. */
  useEffect(() => {
    if (!paused && queueRef.current.length > 0) {
      setEvents((prev) => [...queueRef.current, ...prev].slice(0, BUFFER_CAP));
      queueRef.current = [];
    }
  }, [paused]);

  /* Window selector sets feed depth (since = now − window). */
  const windowMs = timeWindow === "24h" ? 86_400_000 : timeWindow === "7d" ? 7 * 86_400_000 : 30 * 86_400_000;
  const filtered = useMemo(() => {
    const since = Date.now() - windowMs;
    return events.filter((e) => e.at >= since && filters.has(e.type));
  }, [events, filters, windowMs]);

  const hiddenGps = events.filter((e) => e.type === "GPS").length;

  const toggle = (t: FeedType | "ALL") => {
    setFilters((prev) => {
      if (t === "ALL") return new Set(TYPES);
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight > el.scrollHeight - 80) {
      setShowCount((c) => Math.min(c + 60, filtered.length));
    }
    // scroll-up pauses; resume at bottom
    setPaused(el.scrollTop > 40);
  };

  return (
    <div className="flex h-full flex-col" data-tour="ops-feed">
      {/* filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
        {(["ALL", ...TYPES] as const).map((t) => {
          const active = t === "ALL" ? filters.size === TYPES.length : filters.has(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(t)}
              className={cn(
                "rounded border px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors duration-200",
                active
                  ? "border-brand bg-brand text-onbrand"
                  : "border-line text-ink2 hover:border-linestrong hover:text-ink0"
              )}
            >
              {t}
            </button>
          );
        })}
        <span className="rounded border border-line px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-ink2">
          +{312 + hiddenGps} HIDDEN
        </span>
        <AnimatePresence>
          {paused && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="ml-auto flex items-center gap-1.5 rounded border border-warn/40 bg-warn/10 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-warn"
            >
              <Pause className="h-3 w-3" /> PAUSED
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* event log */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-live="polite"
        aria-atomic="false"
        className="max-h-[420px] min-h-[320px] flex-1 overflow-y-auto overscroll-contain"
      >
        <AnimatePresence initial={false}>
          {filtered.slice(0, showCount).map((e) => (
            <FeedRow key={e.id} event={e} fresh={!reduced && freshIds.has(e.id)} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="flex h-32 items-center justify-center font-mono text-[11px] tracking-[0.14em] text-ink2">
            NO EVENTS IN WINDOW — WIDEN THE FILTER
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[9px] tracking-[0.14em] text-ink2">
        <span>BUFFER {events.length}/{BUFFER_CAP} · WINDOW {timeWindow.toUpperCase()}</span>
        <span>HEAT DECAYS AFTER 60S</span>
      </div>
    </div>
  );
}
