/**
 * Dashboard §6 — How It Flows (StepRail; step numbers mirror tour-dashboard)
 * and §7 — Closing Band with live exceptions chip + map ping echoes.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { cn } from "@/lib/utils";
import type { DashboardData } from "./useDashboardData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  { key: "scan", title: "SCAN", body: "Glance the KPI strip. Six numbers tell you if today is normal." },
  { key: "locate", title: "LOCATE", body: "Read the situation map — health dots flag which site needs you first." },
  { key: "follow", title: "FOLLOW", body: "Watch the ops feed. Every putaway, gate-in, GPS tick and EWB change streams here." },
  { key: "triage", title: "TRIAGE", body: "Open the Exception Center. Criticals first — acknowledge what you're handling." },
  { key: "drill", title: "DRILL", body: "Status panels are windows, not rooms. Jump into the owning module in one click." },
  { key: "act", title: "ACT", body: "Fix it on the module page; the dashboard confirms the recovery live." },
];

/**
 * Horizontal 6-step rail with scroll-scrubbed connector fill (shared
 * StepRail recipe, dashboard.md §6: step numbers mirror tour-dashboard).
 * Local because the shared StepRail is a 4-col grid for module pages.
 */
function DashStepRail({ steps }: { steps: typeof STEPS }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const t = (vh * 0.85 - r.top) / (vh * 0.4 + r.height);
        setProgress(Math.max(0, Math.min(1, t)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="relative" data-tour="how-it-flows">
      <div aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-px bg-linestrong lg:block" />
      <motion.div
        aria-hidden
        className="absolute left-0 top-[22px] hidden h-px origin-left bg-data lg:block"
        style={{ scaleX: progress, width: "100%" }}
      />
      <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
        {steps.map((s, i) => {
          const passed = progress * steps.length > i + 0.5;
          return (
            <motion.li
              key={s.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-22% 0px" }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: EASE }}
              className="relative"
            >
              <div
                className={cn(
                  "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border font-mono text-xs transition-colors duration-500",
                  passed ? "border-brand bg-brand text-onbrand" : "border-linestrong bg-surface text-ink2"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-ink0">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink1">{s.body}</p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export function HowItFlows() {
  return (
    <section className="bg-page py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>HOW.IT.FLOWS</SectionKicker>
        <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[40px]">
          <SplitWords text="Run the network in six beats." />
        </h2>
        <div className="mt-12">
          <DashStepRail steps={STEPS} />
        </div>
      </div>
    </section>
  );
}

/** Three faint map pings echoing on a 4s loop behind the closing copy. */
function PingEchoes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        { left: "18%", top: "30%", delay: 0 },
        { left: "74%", top: "22%", delay: 1.3 },
        { left: "52%", top: "68%", delay: 2.6 },
      ].map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-10 w-10 rounded-full border border-data"
          style={{ left: p.left, top: p.top }}
          animate={{ scale: [0.4, 2.2], opacity: [0.35, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function ClosingBand({ data }: { data: DashboardData }) {
  return (
    <section className="relative overflow-hidden bg-void py-24">
      <PingEchoes />
      <div className="relative mx-auto max-w-[1280px] px-6 text-center">
        <SectionKicker className="justify-center">ALWAYS.ON</SectionKicker>
        <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[44px]">
          <SplitWords text="This is what 'live' feels like." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: EASE }}
          className="mx-auto mt-6 max-w-[520px] text-base leading-relaxed text-ink1"
        >
          The dashboard ships with every Stackline deployment — same data, your
          network. Book a demo and we'll stream a day of your own operations
          onto this screen.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.32, duration: 0.8, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/network">Open the network map →</GhostButton>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-crit animate-pulse-dot" />
          EXCEPTIONS NOW:{" "}
          <span className="text-crit font-tnum">{data.kpis.exceptions}</span>
        </motion.div>
      </div>
    </section>
  );
}
