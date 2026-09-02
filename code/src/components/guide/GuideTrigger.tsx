import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  GUIDE_STATE_EVENT,
  getTour,
  isTourCompleted,
  startTour,
} from "@/components/guide/tours";
import { cn } from "@/lib/utils";

const PILL_DELAY_MS = 6000;
const NUDGE_DELAY_MS = 4000;
const NUDGE_KEY = "stackline-guide-nudged"; // JSON array of routes

function wasNudged(route: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(NUDGE_KEY) ?? "[]") as string[]).includes(route);
  } catch {
    return false;
  }
}

function markNudged(route: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(NUDGE_KEY) ?? "[]") as string[];
    if (!arr.includes(route)) {
      arr.push(route);
      localStorage.setItem(NUDGE_KEY, JSON.stringify(arr));
    }
  } catch {
    /* ignore */
  }
}

/** Navbar ghost button: `?` orange chip + mono GUIDE ME + teal done badge. */
export function GuideNavButton({ className }: { className?: string }) {
  const location = useLocation();
  const [, force] = useState(0);

  useEffect(() => {
    const onUpdate = () => force((v) => v + 1);
    window.addEventListener("stackline:guides-updated", onUpdate);
    return () => window.removeEventListener("stackline:guides-updated", onUpdate);
  }, []);

  const hasTour = !!getTour(location.pathname);
  const done = isTourCompleted(location.pathname);

  return (
    <button
      type="button"
      onClick={() => hasTour && startTour(location.pathname)}
      aria-label="Start the guided tour of this page"
      title={hasTour ? "Start guided tour" : "No tour on this page yet"}
      className={cn(
        "relative flex items-center gap-2 rounded-lg border border-linestrong px-3 py-2",
        "font-mono text-xs uppercase tracking-[0.14em] text-ink1 transition-colors duration-300",
        "hover:border-brand hover:text-brand",
        !hasTour && "opacity-40",
        className
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-brand font-mono text-[10px] font-semibold leading-none text-onbrand">
        ?
      </span>
      Guide me
      {done && (
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-data">
          <Check className="h-2.5 w-2.5 text-page" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/**
 * Self-learning entry points below the navbar (guide.md §1):
 *  - Floating bottom-right pill after 6s when this page's tour isn't done.
 *  - First-visit nudge toast after 4s, once per page ever.
 * Mounted once in Layout.
 */
export default function GuideTrigger() {
  const location = useLocation();
  const route = location.pathname;
  const [showPill, setShowPill] = useState(false);
  const [pillDismissed, setPillDismissed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    const onState = (e: Event) =>
      setTourOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener(GUIDE_STATE_EVENT, onState);
    return () => window.removeEventListener(GUIDE_STATE_EVENT, onState);
  }, []);

  /* Reset per-route timers on navigation */
  useEffect(() => {
    setShowPill(false);
    setShowNudge(false);
    setPillDismissed(false);
    const hasTour = !!getTour(route);
    const done = isTourCompleted(route);
    if (!hasTour) return;

    const nudgeT = window.setTimeout(() => {
      if (!done && !wasNudged(route)) {
        setShowNudge(true);
        markNudged(route);
      }
    }, NUDGE_DELAY_MS);
    const pillT = window.setTimeout(() => {
      if (!done) setShowPill(true);
    }, PILL_DELAY_MS);
    return () => {
      window.clearTimeout(nudgeT);
      window.clearTimeout(pillT);
    };
  }, [route]);

  return (
    <>
      {/* Floating pill */}
      <AnimatePresence>
        {showPill && !pillDismissed && !tourOpen && (
          <motion.div
            key="guide-pill"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-1 rounded-full border border-linestrong bg-raised py-1 pl-4 pr-1 shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                setShowPill(false);
                startTour(route);
              }}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink0"
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full bg-data font-mono text-[10px] font-semibold leading-none text-page"
                style={{ animation: "guide-ping 2s ease-out infinite" }}
              >
                ?
              </span>
              Guide me
            </button>
            <button
              type="button"
              aria-label="Dismiss guide pill"
              onClick={() => setPillDismissed(true)}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-ink2 transition-colors hover:text-ink0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-visit nudge toast */}
      <AnimatePresence>
        {showNudge && !tourOpen && (
          <motion.div
            key="guide-nudge"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 z-[60] w-[min(420px,calc(100vw-48px))] -translate-x-1/2 rounded-xl border border-line bg-surface p-4 shadow-2xl"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
              <span className="text-brand">{"//"}</span> First.time.here
            </span>
            <p className="mt-1.5 text-sm leading-relaxed text-ink1">
              Want the 60-second tour of this page?
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNudge(false);
                  startTour(route);
                }}
                className="rounded-lg bg-brand px-4 py-2 font-display text-[13px] font-semibold text-onbrand transition-colors hover:bg-brand-hover"
              >
                Start tour
              </button>
              <button
                type="button"
                onClick={() => setShowNudge(false)}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink2 transition-colors hover:text-ink0"
              >
                Not now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
