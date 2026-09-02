import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FEATURES = [
  "Visual node builder",
  "Barcode/QR scan gates",
  "Role-based approvals",
  "SLA timers & escalation",
  "Exception branches",
  "Full audit trail",
];

/* Node coordinates in a 560×300 viewBox */
const NODES = [
  { id: "RECEIVE", x: 46, y: 150, w: 92, shape: "rect" },
  { id: "SCAN", x: 168, y: 150, w: 78, shape: "rect" },
  { id: "QC?", x: 282, y: 150, w: 70, shape: "gate" },
  { id: "PUTAWAY", x: 408, y: 88, w: 96, shape: "rect" },
  { id: "CONFIRM", x: 520, y: 88, w: 92, shape: "rect" },
  { id: "QUARANTINE", x: 408, y: 224, w: 118, shape: "rect" },
] as const;

const EDGES = [
  { from: 0, to: 1, step: 1 },
  { from: 1, to: 2, step: 2 },
  { from: 2, to: 3, step: 3, cls: "pass" },
  { from: 2, to: 5, step: 3, cls: "hold" },
  { from: 3, to: 4, step: 4 },
] as const;

/** Auto-playing mini graph: RECEIVE → SCAN → QC? → PUTAWAY → CONFIRM (+HOLD branch). */
function MiniGraph() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % 7), 1000);
    return () => window.clearInterval(t);
  }, [visible]);

  const activeIdx = step % 6; // 6 = brief rest with all lit

  return (
    <div ref={ref}>
      <svg viewBox="0 0 560 300" className="w-full" role="img" aria-label="Workflow graph: receive, scan, QC gate, putaway, confirm">
        <defs>
          <marker id="wf-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 z" fill="#5C6773" />
          </marker>
        </defs>

        {EDGES.map((e, i) => {
          const a = NODES[e.from];
          const b = NODES[e.to];
          const on = activeIdx >= e.step;
          const branch = "cls" in e ? e.cls : null;
          const x1 = a.x + a.w / 2;
          const y1 = a.y;
          const x2 = b.x - b.w / 2;
          const y2 = b.y;
          const midX = (x1 + x2) / 2;
          const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2 - 6} ${y2}`;
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke={branch === "hold" ? "#F4504E" : branch === "pass" ? "#2DD4BF" : "#5C6773"}
                strokeOpacity={on ? (branch ? 0.9 : 0.7) : 0.18}
                strokeWidth="1.5"
                strokeDasharray={branch ? "5 4" : "140"}
                strokeDashoffset={on ? 0 : branch ? 0 : 140}
                markerEnd="url(#wf-arrow)"
                style={{ transition: "stroke-dashoffset 0.4s ease, stroke-opacity 0.4s ease" }}
                className={cn(on && branch && "animate-dash-flow")}
              />
              {branch && on && (
                <text
                  x={midX}
                  y={(y1 + y2) / 2 - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  fill={branch === "hold" ? "#F4504E" : "#2DD4BF"}
                  style={{ opacity: on ? 1 : 0, transition: "opacity 0.4s ease" }}
                >
                  {branch === "hold" ? "HOLD" : "PASS"}
                </text>
              )}
            </g>
          );
        })}

        {NODES.map((n, i) => {
          const isActive = activeIdx === i || (activeIdx === 5 && i < 5);
          const isHoldBranch = i === 5;
          const lit = isHoldBranch ? activeIdx >= 3 : true;
          return (
            <g key={n.id} style={{ opacity: lit ? 1 : 0.25, transition: "opacity 0.4s ease" }}>
              {isActive && (
                <rect
                  x={n.x - n.w / 2 - 6}
                  y={n.y - 25}
                  width={n.w + 12}
                  height={50}
                  rx="10"
                  fill="none"
                  stroke="#FF6B1A"
                  strokeOpacity="0.5"
                  className="animate-[ripple_1.4s_ease-out_infinite]"
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              )}
              <rect
                x={n.x - n.w / 2}
                y={n.y - 19}
                width={n.w}
                height={38}
                rx="8"
                fill={isActive ? "rgba(255,107,26,0.12)" : "#12161C"}
                stroke={isHoldBranch ? "#F4504E" : isActive ? "#FF6B1A" : "rgba(148,163,184,0.3)"}
                strokeOpacity={isHoldBranch ? 0.7 : 1}
                style={{ transition: "all 0.35s ease" }}
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="1.5"
                fill={isHoldBranch ? "#F4504E" : isActive ? "#FF8A45" : "#9AA7B5"}
                style={{ transition: "fill 0.35s ease" }}
              >
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between border-t border-line px-1 pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
        <span>Auto-play · loop</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse-dot" />
          Step {Math.min(activeIdx + 1, 6)}/6
        </span>
      </div>
    </div>
  );
}

export default function EngineWorkflow() {
  return (
    <section id="engine-workflow" className="scroll-mt-32 bg-void py-24 md:py-40">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-[45%_55%] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>ENGINE.04</SectionKicker>
          <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Workflows the floor actually follows." />
          </h2>
          <p className="mt-5 max-w-[52ch] leading-relaxed text-ink1">
            Compose receiving, putaway, picking, packing and counting as visual
            node graphs — scan gates, approvals, SLA timers, exception branches.
            Every step is a screen on a handheld and a document in ERPNext.
          </p>
          <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: EASE }}
                className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink1"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-data" />
                {f}
              </motion.li>
            ))}
          </ul>
          <div className="mt-8">
            <GhostButton to="/workflow">Explore workflow studio →</GhostButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            <span>Live demo · node graph</span>
            <span className="text-brand">QC branch active</span>
          </div>
          <BlueprintCard className="p-5 sm:p-6">
            <MiniGraph />
          </BlueprintCard>
        </motion.div>
      </div>
    </section>
  );
}
