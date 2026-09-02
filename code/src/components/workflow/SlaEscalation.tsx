import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, ShieldCheck, Timer } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CARDS = [
  {
    icon: Timer,
    title: "SLA TIMERS",
    copy: "Per-node targets, amber at 80%, crit at breach.",
    accent: "text-warn",
  },
  {
    icon: ShieldCheck,
    title: "ROLE GATES",
    copy: "Approvals scoped by Frappe roles — no shared logins.",
    accent: "text-data",
  },
  {
    icon: BellRing,
    title: "ESCALATION PATHS",
    copy: "Notify → reassign → supervisor override, all logged.",
    accent: "text-brand",
  },
];

const TIMELINE = [
  { t: "T+0", label: "Node active", sub: "SLA timer starts on the floor", color: "#2DD4BF" },
  { t: "T+15 MIN", label: "Warn", sub: "Node turns amber on the twin", color: "#FFB020" },
  { t: "T+30 MIN", label: "Escalate", sub: "Task re-offered to the zone", color: "#FF6B1A" },
  { t: "T+45 MIN", label: "Supervisor notified", sub: "Override or reassign — logged", color: "#F4504E" },
];

function EscalationTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setOn(true), io.disconnect()),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative pl-10">
      {/* growing line */}
      <span className="absolute bottom-6 left-[13px] top-6 w-px bg-line" aria-hidden />
      <span
        className="absolute left-[13px] top-6 w-px origin-top bg-gradient-to-b from-data via-warn to-crit transition-transform [transition-duration:1400ms] ease-out"
        style={{ height: "calc(100% - 48px)", transform: on ? "scaleY(1)" : "scaleY(0)" }}
        aria-hidden
      />
      <div className="flex flex-col gap-8">
        {TIMELINE.map((s, i) => (
          <motion.div
            key={s.t}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 * i + 0.2, duration: 0.5, ease: EASE }}
            className="relative"
          >
            <span
              className={cn("absolute -left-10 top-1 h-[13px] w-[13px] rounded-full border-2 bg-void", on && "scale-100")}
              style={{ borderColor: s.color, transform: on ? "scale(1)" : "scale(0)", transition: `transform 0.3s ease ${0.15 * i + 0.2}s` }}
            />
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] font-semibold tracking-[0.14em] font-tnum" style={{ color: s.color }}>
                {s.t}
              </span>
              <span className="font-display text-base font-semibold text-ink0">{s.label}</span>
            </div>
            <p className="mt-1 text-sm text-ink1">{s.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function SlaEscalation() {
  return (
    <section className="bg-void py-24 md:py-36">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>GOVERNANCE</SectionKicker>
          <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Nothing stalls silently." />
          </h2>
          <p className="mt-5 max-w-[52ch] leading-relaxed text-ink1">
            Every node can carry an SLA timer, a responsible role and an
            escalation path. Supervisors see bottlenecks on the twin as they
            form — a pulsing amber bin, not a surprise report.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            {CARDS.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12 * i, duration: 0.6, ease: EASE }}
                >
                  <BlueprintCard className="flex items-start gap-4 p-5">
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-raised", c.accent)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-mono text-[12px] font-semibold tracking-[0.16em] text-ink0">
                        {c.title}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink1">{c.copy}</p>
                    </div>
                  </BlueprintCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            Escalation timeline · per node
          </div>
          <BlueprintCard className="p-6 sm:p-8">
            <EscalationTimeline />
          </BlueprintCard>
        </motion.div>
      </div>
    </section>
  );
}
