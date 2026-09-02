import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  GUIDE_START_EVENT,
  GUIDE_STATE_EVENT,
  getTour,
  markStepsSeen,
  markTourCompleted,
  type Tour,
  type TourStep,
} from "@/components/guide/tours";
import { cn } from "@/lib/utils";

type Rect = { x: number; y: number; w: number; h: number };

const PAD = 8;
const CARD_W = 340;
const CARD_H = 240; // planning estimate for placement math
const GAP = 20;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function findTarget(step: TourStep): Element | null {
  return (
    document.querySelector(step.target) ??
    (step.fallback ? document.querySelector(step.fallback) : null)
  );
}

function targetLabel(step: TourStep): string {
  const m = /data-tour="([^"]+)"/.exec(step.target);
  return `ELEMENT: ${(m?.[1] ?? step.target).toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

/** Position the card next to the spotlight, flipping sides when space runs out. */
function placeCard(
  rect: Rect,
  placement: TourStep["placement"],
  vw: number,
  vh: number
): { x: number; y: number; side: "top" | "bottom" | "left" | "right" } {
  let side: "top" | "bottom" | "left" | "right" =
    placement && placement !== "auto" ? placement : "bottom";
  const fits = {
    bottom: rect.y + rect.h + GAP + CARD_H < vh,
    top: rect.y - GAP - CARD_H > 0,
    right: rect.x + rect.w + GAP + CARD_W < vw,
    left: rect.x - GAP - CARD_W > 0,
  };
  if (!fits[side]) {
    side =
      (["bottom", "top", "right", "left"] as const).find((s) => fits[s]) ??
      "bottom";
  }
  let x = 0;
  let y = 0;
  if (side === "bottom") y = rect.y + rect.h + GAP;
  if (side === "top") y = rect.y - CARD_H - GAP;
  if (side === "left" || side === "right") {
    y = rect.y + rect.h / 2 - CARD_H / 2;
    x = side === "right" ? rect.x + rect.w + GAP : rect.x - CARD_W - GAP;
  }
  if (side === "bottom" || side === "top") x = rect.x + rect.w / 2 - CARD_W / 2;
  return {
    x: Math.min(Math.max(12, x), Math.max(12, vw - CARD_W - 12)),
    y: Math.min(Math.max(12, y), Math.max(12, vh - CARD_H - 12)),
    side,
  };
}

function Brackets() {
  const b = "pointer-events-none absolute h-[14px] w-[14px] border-brand";
  return (
    <>
      <span className={cn(b, "-left-px -top-px border-l-2 border-t-2")} />
      <span className={cn(b, "-right-px -top-px border-r-2 border-t-2 opacity-40")} />
      <span className={cn(b, "-bottom-px -left-px border-b-2 border-l-2 opacity-40")} />
      <span className={cn(b, "-bottom-px -right-px border-b-2 border-r-2")} />
    </>
  );
}

/**
 * GuideTour engine (guide.md §2): full-viewport dim overlay with a spotlight
 * cutout around the active target, a numbered BlueprintCard tooltip, keyboard
 * nav, "Try it" interactive steps and a mobile bottom-sheet layout.
 * Mounted once in Layout; started via `startTour(route)`.
 */
export default function GuideTour() {
  const [tour, setTour] = useState<Tour | null>(null);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tried, setTried] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const targetRef = useRef<Element | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(
    (completed: boolean, stepsSeen: number) => {
      if (!tour) return;
      if (completed) markTourCompleted(tour.route, tour.steps.length);
      else markStepsSeen(tour.route, stepsSeen);
      setTour(null);
      setRect(null);
      setIdx(0);
      window.dispatchEvent(
        new CustomEvent(GUIDE_STATE_EVENT, { detail: { open: false } })
      );
    },
    [tour]
  );

  /* Listen for start requests */
  useEffect(() => {
    const onStart = (e: Event) => {
      const route =
        (e as CustomEvent<string>).detail ?? window.location.pathname;
      const t = getTour(route);
      if (!t) return;
      setTour(t);
      setIdx(0);
      setTried(false);
      window.dispatchEvent(
        new CustomEvent(GUIDE_STATE_EVENT, { detail: { open: true } })
      );
    };
    window.addEventListener(GUIDE_START_EVENT, onStart);
    return () => window.removeEventListener(GUIDE_START_EVENT, onStart);
  }, []);

  /* Measure the active target (auto-scroll it into view first if needed) */
  const measure = useCallback(
    (scroll: boolean) => {
      if (!tour) return;
      const step = tour.steps[idx];
      if (!step) return;
      let el = findTarget(step);
      // Skip steps whose target is genuinely absent
      if (!el) {
        const nextValid = tour.steps.findIndex((s, i) => i > idx && findTarget(s));
        if (nextValid > idx) {
          setIdx(nextValid);
          return;
        }
        close(false, idx);
        return;
      }
      targetRef.current = el;
      const apply = () => {
        const r = el!.getBoundingClientRect();
        setRect({
          x: r.left - PAD,
          y: r.top - PAD,
          w: r.width + PAD * 2,
          h: r.height + PAD * 2,
        });
      };
      const r = el.getBoundingClientRect();
      const offscreen = r.top < 0 || r.bottom > window.innerHeight;
      if (scroll && offscreen) {
        el.scrollIntoView({
          behavior: reducedMotion() ? "auto" : "smooth",
          block: "center",
        });
        window.setTimeout(apply, reducedMotion() ? 60 : 450);
      } else {
        apply();
      }
    },
    [tour, idx, close]
  );

  useEffect(() => {
    if (!tour) return;
    measure(true);
  }, [tour, idx, measure]);

  /* Keep the spotlight glued to its target on scroll/resize */
  useEffect(() => {
    if (!tour) return;
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => measure(false));
    };
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      onMove();
    };
    setIsMobile(window.innerWidth < 768);
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [tour, measure]);

  /* "Try it" steps: Next unlocks once the user clicks the target */
  const step = tour?.steps[idx];
  useEffect(() => {
    if (!tour || !step?.tryIt || !targetRef.current) return;
    setTried(false);
    const el = targetRef.current;
    const onClick = () => setTried(true);
    el.addEventListener("click", onClick, { capture: true });
    return () => el.removeEventListener("click", onClick, { capture: true });
  }, [tour, idx, step]);

  /* Keyboard: →/Enter next, ← back, Esc skip */
  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false, idx + 1);
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (
        (e.key === "ArrowRight" || e.key === "Enter") &&
        (!step?.tryIt || tried)
      ) {
        if (idx === tour.steps.length - 1) close(true, tour.steps.length);
        else {
          setTried(false);
          setIdx((i) => i + 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    nextRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, idx, tried, step, close]);

  const open = tour !== null && rect !== null;
  const n = tour?.steps.length ?? 0;
  const dur = reducedMotion() ? 0 : 0.45;
  const cardPos =
    open && rect && !isMobile
      ? placeCard(rect, step?.placement, window.innerWidth, window.innerHeight)
      : null;

  const nextLocked = !!step?.tryIt && !tried;

  return (
    <AnimatePresence>
      {open && rect && tour && step && (
        <div
          className="fixed inset-0 z-[150]"
          role="dialog"
          aria-modal="true"
          aria-label={`Guided tour: ${tour.label}`}
        >
          {/* Dim backdrop as 4 rects around the spotlight cutout */}
          {(
            [
              { x: 0, y: 0, w: window.innerWidth, h: Math.max(0, rect.y) },
              {
                x: 0,
                y: rect.y + rect.h,
                w: window.innerWidth,
                h: Math.max(0, window.innerHeight - rect.y - rect.h),
              },
              { x: 0, y: rect.y, w: Math.max(0, rect.x), h: rect.h },
              {
                x: rect.x + rect.w,
                y: rect.y,
                w: Math.max(0, window.innerWidth - rect.x - rect.w),
                h: rect.h,
              },
            ] as Rect[]
          ).map((d, i) => (
            <motion.div
              key={i}
              className="absolute left-0 top-0"
              style={{ background: "var(--guide-dim)" }}
              initial={false}
              animate={{ x: d.x, y: d.y, width: d.w, height: d.h }}
              transition={{ duration: dur, ease: EASE }}
              onClick={() => close(false, idx + 1)}
            />
          ))}

          {/* Spotlight ring + brackets */}
          <motion.div
            className="pointer-events-none absolute left-0 top-0 rounded-xl border border-brand"
            initial={false}
            animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
            transition={{ duration: dur, ease: EASE }}
          >
            <Brackets />
          </motion.div>

          {/* Click-through blocker over the target for non-interactive steps */}
          {!step.tryIt && (
            <motion.div
              className="absolute left-0 top-0 cursor-default rounded-xl"
              initial={false}
              animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
              transition={{ duration: dur, ease: EASE }}
            />
          )}

          {/* Step card */}
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={
              reducedMotion()
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 26 }
            }
            className={cn(
              "absolute rounded-xl border border-line bg-surface p-5 shadow-2xl",
              isMobile
                ? "inset-x-0 bottom-0 rounded-b-none border-x-0 border-b-0 pb-8"
                : "w-[340px]"
            )}
            style={
              isMobile || !cardPos
                ? undefined
                : { left: cardPos.x, top: cardPos.y }
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.18em] text-ink2">
                STEP{" "}
                <span className="text-brand">
                  {String((step.step ?? idx + 1)).padStart(2, "0")}
                </span>
                /{String(n).padStart(2, "0")}
                <span className="ml-3 text-[10px]">{targetLabel(step)}</span>
              </span>
              <button
                type="button"
                onClick={() => close(false, idx + 1)}
                className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2 underline-offset-2 transition-colors hover:text-ink1 hover:underline"
              >
                Skip tour
              </button>
            </div>

            <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink0">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-[1.6] text-ink1">{step.body}</p>
            {step.tryIt && (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-data">
                Try it: <span className="normal-case tracking-normal">{step.tryIt}</span>
              </p>
            )}

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {tour.steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full border",
                      i === idx
                        ? "border-brand bg-brand"
                        : i < idx
                          ? "border-data bg-data"
                          : "border-linestrong bg-transparent"
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTried(false);
                      setIdx((i) => Math.max(0, i - 1));
                    }}
                    className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink1 transition-colors hover:text-ink0"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                )}
                <button
                  ref={nextRef}
                  type="button"
                  disabled={nextLocked}
                  onClick={() => {
                    if (idx === n - 1) close(true, n);
                    else {
                      setTried(false);
                      setIdx((i) => i + 1);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-4 py-2 font-display text-[13px] font-semibold transition-all duration-300",
                    nextLocked
                      ? "cursor-not-allowed bg-raised text-ink2"
                      : "bg-brand text-onbrand hover:bg-brand-hover"
                  )}
                >
                  {idx === n - 1 ? "Finish" : "Next"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
