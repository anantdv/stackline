import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Box, FileWarning, Scale, ShieldQuestion } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type ChipState = "idle" | "trigger" | "verdict";

interface Rule {
  icon: typeof Box;
  title: string;
  body: React.ReactNode;
  chip: { text: string; tone: "crit" | "warn" };
  mono: string;
}

const RULES: Rule[] = [
  {
    icon: FileWarning,
    title: "Declaration mismatch",
    body: "X-ray density profile vs declared item category — parcel routes to the exception lane.",
    chip: { text: "HOLD", tone: "crit" },
    mono: "RULE XRAY-01 · DENSITY ≠ DECLARED",
  },
  {
    icon: Box,
    title: "Dimension deviation",
    body: "Captured dims differ from the item master >5% — one click posts the item update to ERPNext.",
    chip: { text: "MASTER UPDATE SUGGESTED", tone: "warn" },
    mono: "RULE DWS-02 · TOL ±5%",
  },
  {
    icon: Scale,
    title: "Overweight / oversize",
    body: (
      <>
        Exceeds the chosen transport method's limits — blocks load-plan
        assignment on <Link to="/transport" className="text-data underline decoration-data/40 underline-offset-2 hover:text-brand">/transport</Link>.
      </>
    ),
    chip: { text: "LOAD PLAN BLOCKED", tone: "crit" },
    mono: "RULE DWS-03 · PER-METHOD LIMITS",
  },
  {
    icon: ShieldQuestion,
    title: "Density anomaly",
    body: "Hollow spots or unexpected voids in sealed cartons trigger a side-scan re-capture.",
    chip: { text: "RE-CHECK", tone: "warn" },
    mono: "RULE XRAY-04 · VOID > 12% VOL",
  },
];

/** Live chip demo: idle → trigger → verdict pop on a 3s loop. */
function RuleChip({ chip, offset }: { chip: Rule["chip"]; offset: number }) {
  const [state, setState] = useState<ChipState>("idle");
  useEffect(() => {
    let t1 = 0;
    let t2 = 0;
    const cycle = () => {
      setState("idle");
      t1 = window.setTimeout(() => setState("trigger"), 1000);
      t2 = window.setTimeout(() => setState("verdict"), 2000);
    };
    const start = window.setTimeout(cycle, offset);
    const loop = window.setInterval(cycle, 3000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(loop);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [offset]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-all duration-300",
        state === "verdict" &&
          (chip.tone === "crit" ? "border-crit/60 bg-crit/10 text-crit" : "border-warn/60 bg-warn/10 text-warn"),
        state === "trigger" && "border-linestrong text-ink1",
        state === "idle" && "border-line text-ink2"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors duration-300",
          state === "verdict" ? (chip.tone === "crit" ? "bg-crit" : "bg-warn") : "bg-ink2",
          state === "trigger" && "animate-pulse bg-warn"
        )}
      />
      {state === "verdict" ? chip.text : state === "trigger" ? "CHECKING…" : "MONITORING"}
    </span>
  );
}

export default function FlagRules() {
  return (
    <section className="bg-void py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>EXCEPTIONS</SectionKicker>
        <h2 className="mt-6 max-w-[760px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          The bay says no, politely and automatically.
        </h2>

        <div data-tour="flag-rules" className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: EASE }}
              className="group/rule"
            >
              <BlueprintCard className="flex h-full flex-col p-5">
                <r.icon className="h-5 w-5 text-brand" />
                <h3 className="mt-3 font-display text-[17px] font-semibold tracking-[-0.01em] text-ink0">
                  {r.title}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-[1.6] text-ink1">{r.body}</p>
                <div className="mt-4">
                  <RuleChip chip={r.chip} offset={i * 700} />
                </div>
                <p className="mt-3 max-h-0 overflow-hidden font-mono text-[9px] uppercase tracking-[0.12em] text-ink2 opacity-0 transition-all duration-300 group-hover/rule:max-h-6 group-hover/rule:opacity-100">
                  {r.mono}
                </p>
              </BlueprintCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
