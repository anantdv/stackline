import { motion } from "framer-motion";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Faint pulsing node-graph backdrop. */
function PulseGraph() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 h-full w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-25"
      viewBox="0 0 900 320"
      fill="none"
    >
      {[
        "M60 160 H300 M300 160 L520 80 M300 160 L520 240 M520 80 H760 M520 240 H760",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="#2DD4BF"
          strokeOpacity="0.5"
          strokeDasharray="4 18"
          className="animate-dash-flow"
          style={{ animationDuration: "3s" }}
        />
      ))}
      {[
        { x: 60, y: 160 }, { x: 300, y: 160 }, { x: 520, y: 80 },
        { x: 520, y: 240 }, { x: 760, y: 80 }, { x: 760, y: 240 },
      ].map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r="7"
          fill="#0B0E12" stroke="#FF6B1A" strokeOpacity="0.7"
          className="animate-pulse-dot"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </svg>
  );
}

export default function WorkflowCta() {
  return (
    <section className="relative overflow-hidden bg-page py-24 md:py-32">
      <PulseGraph />
      <div className="relative mx-auto max-w-[1280px] px-6 text-center">
        <h2 className="mx-auto max-w-3xl font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
          <SplitWords text="Put your floor on rails." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          className="mx-auto mt-4 max-w-xl text-lg text-ink1"
        >
          Import a template, tune the rules, go live this week.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/features">See the four engines</GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
