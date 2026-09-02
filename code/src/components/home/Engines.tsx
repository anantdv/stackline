import { motion } from "framer-motion";
import { Move3d, Box, Sparkles, Workflow } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { MonoLink } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Mini-demo 1: carton arcs between two racks on hover */
function MovementDemo() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-t-lg bg-void/60">
      <div className="absolute bottom-6 left-6 h-20 w-14 rounded-sm border border-linestrong bg-raised">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mx-1 mt-1.5 h-4 rounded-sm bg-brand/70" />
        ))}
      </div>
      <div className="absolute bottom-6 right-6 h-20 w-14 rounded-sm border border-linestrong bg-raised">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mx-1 mt-1.5 h-4 rounded-sm bg-brand/40" />
        ))}
      </div>
      {/* traveling carton */}
      <div className="absolute bottom-[74px] left-8 h-4 w-4 rounded-[2px] bg-[#C8A27A] shadow-glow-data [animation:carton-arc_2.6s_cubic-bezier(0.3,0.7,0.3,1)_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]" />
      {/* teal path */}
      <svg className="absolute bottom-[70px] left-8 h-16 w-[152px]" viewBox="0 0 152 64" fill="none">
        <path
          d="M2 60 Q 76 -20 150 60"
          stroke="#2DD4BF"
          strokeOpacity="0.6"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          className="animate-dash-flow"
        />
      </svg>
    </div>
  );
}

/* Mini-demo 2: wireframe bin filling with cartons */
function CapacityDemo() {
  return (
    <div className="relative flex h-full w-full items-end justify-center gap-6 overflow-hidden rounded-t-lg bg-void/60 pb-8">
      <div className="relative h-28 w-24 rounded-sm border border-dashed border-linestrong">
        <div className="absolute inset-x-1 bottom-1 rounded-sm bg-data/25 [animation:bin-fill_3.4s_ease-in-out_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]" />
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-1 p-1">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="h-6 rounded-[2px] bg-[#C8A27A]/80" />
          ))}
        </div>
      </div>
      <div className="absolute right-4 top-4 text-right">
        <div className="font-mono text-lg font-semibold text-ink0 font-tnum">
          14<span className="text-ink2"> / </span>18
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
          Cartons
        </div>
      </div>
    </div>
  );
}

/* Mini-demo 3: three candidate bins, best one pulses */
function AllocationDemo() {
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-4 overflow-hidden rounded-t-lg bg-void/60">
      <div className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-[3px] bg-[#C8A27A] [animation:carton-arc_3s_ease-in-out_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]" />
      {[
        { label: "B-02-03", color: "border-data text-data", active: true },
        { label: "B-05-01", color: "border-warn text-warn", active: false },
        { label: "C-01-04", color: "border-crit text-crit", active: false },
      ].map((b, i) => (
        <div
          key={b.label}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-md border bg-raised font-mono text-[10px] ${b.color} ${
            b.active ? "[animation:route-ping_2s_ease-in-out_infinite]" : "opacity-60"
          }`}
          style={{ animationDelay: `${i * 0.25}s` }}
        >
          {b.label}
          <span className="mt-1 text-[9px] opacity-70">
            {i === 0 ? "62%" : i === 1 ? "84%" : "93%"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Mini-demo 4: workflow node graph lighting up */
function WorkflowDemo() {
  const nodes = ["RECEIVE", "SCAN", "PUTAWAY", "CONFIRM"];
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-t-lg bg-void/60 px-4">
      <div className="flex items-center">
        {nodes.map((n, i) => (
          <div key={n} className="flex items-center">
            <div
              className="rounded-md border border-linestrong bg-raised px-2.5 py-2 font-mono text-[9px] tracking-[0.1em] text-ink2 [animation:node-pulse_3.2s_ease-in-out_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]"
              style={{ animationDelay: `${i * 0.8}s` }}
            >
              {n}
            </div>
            {i < nodes.length - 1 && (
              <div className="h-px w-4 bg-linestrong md:w-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const ENGINES = [
  {
    icon: Move3d,
    title: "Visual Stock Movement",
    copy: "Drag cartons between bins in 3D. Stackline posts the Stock Entry to ERPNext and animates the physical route — picker sees the path, not a form.",
    stat: "4,212 MOVES / DAY",
    demo: <MovementDemo />,
  },
  {
    icon: Box,
    title: "Bin Capacity Calculator",
    copy: "Volumetric fill with real constraints — orientation, stackability, max weight. Know exactly how many cartons fit any bin before the truck arrives.",
    stat: "±0.4% FILL ACCURACY",
    demo: <CapacityDemo />,
  },
  {
    icon: Sparkles,
    title: "Auto-Allocation Engine",
    copy: "FEFO, FIFO, velocity zoning, lot grouping, weight limits — scored in milliseconds, allocated automatically, always explainable.",
    stat: "98.6% FIRST-PICK HIT",
    demo: <AllocationDemo />,
  },
  {
    icon: Workflow,
    title: "Workflow Orchestration",
    copy: "Compose floor workflows as visual node graphs — scans, approvals, SLA timers — and drive your team step by step on any device.",
    stat: "31% FASTER PUTAWAY",
    demo: <WorkflowDemo />,
  },
];

export default function Engines() {
  return (
    <section data-tour="engines" className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>CORE.ENGINES</SectionKicker>
        <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="One twin. Four engines." />
        </h2>
        <p className="mt-4 max-w-[520px] text-base leading-[1.65] text-ink1 md:text-lg">
          Every module reads and writes the same live 3D model — no exports, no
          swivel-chair.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {ENGINES.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ delay: (i % 2) * 0.12, duration: 0.8, ease: EASE }}
            >
              <BlueprintCard className="flex min-h-[420px] flex-col overflow-hidden">
                <div className="relative h-[55%] min-h-[220px]">{e.demo}</div>
                <div className="flex flex-1 flex-col gap-3 border-t border-line p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-brand">
                      <e.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-xl font-semibold text-ink0 md:text-2xl">
                      {e.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-ink1">{e.copy}</p>
                  <span className="mt-auto pt-2 font-mono text-[11px] tracking-[0.14em] text-data">
                    {e.stat}
                  </span>
                </div>
              </BlueprintCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <MonoLink to="/features">Full feature breakdown</MonoLink>
        </div>
      </div>
    </section>
  );
}
