import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Check } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import PhoneFrame, { PhoneTabBar } from "@/components/mobile/PhoneFrame";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  { n: "01", name: "TASK LIST", copy: "Grouped cards with per-task SLA chips — putaways, picking waves, cycle counts." },
  { n: "02", name: "NAVIGATE", copy: "Top-down aisle map draws a teal path from you to the target bin, with distance." },
  { n: "03", name: "SCAN & CONFIRM", copy: "Scan the bin QR, scan the carton, step the qty, hit confirm. Gloves-friendly." },
  { n: "04", name: "POSTED", copy: "The move becomes an ERPNext Stock Entry in milliseconds — teal check, done." },
  { n: "05", name: "NEXT UP", copy: "The list re-ranks by SLA and proximity; the next task slides in from below." },
];

function TaskCard({ title, meta, due, dim }: { title: string; meta: string; due?: string; dim?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface p-2.5", dim && "opacity-50")}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] font-semibold tracking-[0.08em] text-ink0">{title}</span>
        {due && (
          <span className="rounded border border-warn/50 bg-warn/10 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.1em] text-warn">
            DUE {due}
          </span>
        )}
      </div>
      <div className="mt-0.5 font-mono text-[8px] tracking-[0.12em] text-ink2">{meta}</div>
    </div>
  );
}

/* In-phone screens per step (micro-animations keyed by step) */
function Screen({ step }: { step: number }) {
  return (
    <div className="flex flex-1 flex-col gap-2 px-4 pb-2 pt-3">
      {step === 0 && (
        <>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">Today · Zone A</div>
          <TaskCard title="PUTAWAY · ASN-0117" meta="4 PALLETS · DOCK 2 → ZONE A" due="11:30" />
          <TaskCard title="PICKING · WAVE W-42" meta="12 LINES · ZONE A/B" due="12:15" />
          <TaskCard title="CYCLE COUNT · ZONE C" meta="30 BINS · ABC CLASS A" due="14:00" />
          <TaskCard title="REPLENISH · FWD PICK" meta="6 SKUS · ZONE A" />
        </>
      )}
      {step === 1 && (
        <>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">Navigate</div>
          <div className="relative h-[340px] overflow-hidden rounded-xl border border-line bg-void">
            <svg viewBox="0 0 240 330" className="h-full w-full">
              {Array.from({ length: 6 }, (_, r) => (
                <rect key={r} x={20} y={24 + r * 46} width={200} height={20} rx={2} fill="none" stroke="var(--line-strong)" />
              ))}
              <motion.path
                d="M40 310 V160 H120 V80"
                fill="none"
                stroke="var(--data)"
                strokeWidth={2}
                strokeDasharray="6 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: EASE }}
              />
              <rect x={112} y={72} width={16} height={16} fill="var(--accent)" rx={2} />
            </svg>
            <span className="absolute bottom-8 left-8 h-2.5 w-2.5 rounded-full bg-data animate-pulse-dot" aria-hidden />
          </div>
          <div className="rounded-lg border border-data/40 bg-data-soft px-3 py-2 font-mono text-[9px] tracking-[0.1em] text-data">
            A-04-02-03 · 14M ▸ STRAIGHT, BAY 4 LEFT
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">Scan & confirm</div>
          <div className="relative h-[150px] overflow-hidden rounded-xl border border-line bg-void">
            <div className="absolute left-1/2 top-1/2 flex h-16 w-28 -translate-x-1/2 -translate-y-1/2 items-end gap-[2px] bg-white px-2 py-1">
              {Array.from({ length: 18 }, (_, i) => (
                <span key={i} className="bg-black" style={{ width: i % 3 === 0 ? 3 : 1.5, height: "100%" }} />
              ))}
            </div>
            <motion.div
              className="absolute left-3 right-3 h-[2px] bg-brand shadow-glow"
              animate={{ y: [8, 130, 8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2">
            <span className="font-mono text-[9px] tracking-[0.1em] text-ink2">QTY</span>
            <span className="font-display text-lg font-semibold text-ink0 font-tnum">4</span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="rounded-lg bg-brand py-3 text-center font-display text-sm font-semibold text-onbrand"
          >
            CONFIRM PUTAWAY
          </motion.div>
        </>
      )}
      {step === 3 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-data text-void"
          >
            <Check className="h-10 w-10" strokeWidth={3} />
          </motion.span>
          {/* check burst rings */}
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.2 + i * 0.3, repeat: Infinity, repeatDelay: 1 }}
              className="absolute h-20 w-20 rounded-full border border-data"
              aria-hidden
            />
          ))}
          <div className="text-center font-mono text-[9px] leading-relaxed tracking-[0.1em] text-data">
            STOCK ENTRY STE-0117 POSTED
            <br />
            <span className="text-ink2">SYNC 12MS · ERPNext ✓</span>
          </div>
        </div>
      )}
      {step === 4 && (
        <>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">Re-ranked · Next up</div>
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <TaskCard title="PICKING · WAVE W-42" meta="12 LINES · ZONE A/B · 40M" due="12:15" />
          </motion.div>
          <TaskCard title="CYCLE COUNT · ZONE C" meta="30 BINS · ABC CLASS A" due="14:00" dim />
          <TaskCard title="REPLENISH · FWD PICK" meta="6 SKUS · ZONE A" dim />
          <div className="rounded-lg border border-line bg-page/60 px-3 py-2 font-mono text-[8px] tracking-[0.12em] text-ink2">
            1/17 TASKS DONE · ON PACE
          </div>
        </>
      )}
      <PhoneTabBar active="TASKS" />
    </div>
  );
}

export default function DayOnFloor() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, Math.floor(v * STEPS.length))));
  });

  const inner = (
    <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 lg:grid-cols-2">
      {/* step rail */}
      <div>
        <SectionKicker>DAY.ON.THE.FLOOR</SectionKicker>
        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[44px] md:leading-[1.05]">
          One shift, five taps.
        </h2>
        <div className="mt-10 flex flex-col">
          {STEPS.map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.n} className="relative flex gap-4 border-l border-line pb-8 pl-6 last:pb-0">
                {/* connector fill */}
                {done && <span className="absolute -left-px top-0 h-full w-px bg-brand" aria-hidden />}
                <span
                  className={cn(
                    "absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border transition-colors duration-300",
                    active ? "border-brand bg-brand" : done ? "border-brand bg-void" : "border-linestrong bg-void"
                  )}
                  aria-hidden
                />
                <div className={cn("transition-opacity duration-300", active || done ? "opacity-100" : "opacity-40")}>
                  <div className="font-mono text-[10px] tracking-[0.18em]">
                    <span className="text-brand">{s.n}</span>
                    <span className="text-ink1"> · {s.name}</span>
                  </div>
                  <p className="mt-1.5 max-w-[400px] text-sm leading-[1.6] text-ink1">{s.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* morphing phone */}
      <div className="relative flex justify-center">
        <PhoneFrame width={320} height={650}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-1 flex-col"
            >
              <Screen step={step} />
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
        <span className="absolute -bottom-6 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">
          STEP {STEPS[step]!.n}/05 · {STEPS[step]!.name}
        </span>
      </div>
    </div>
  );

  return (
    <section ref={ref} className="relative bg-void" style={{ height: reduced ? "auto" : "240vh" }}>
      <div
        className={cn(
          "flex items-center overflow-hidden px-6 py-16",
          reduced ? "" : "sticky top-[72px] min-h-[calc(100dvh-72px)]"
        )}
      >
        {inner}
      </div>
    </section>
  );
}
