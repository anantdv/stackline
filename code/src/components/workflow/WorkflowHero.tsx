import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton } from "@/components/Buttons";
import { SplitChars } from "@/components/SplitText";
import { NODE_COLOR_HEX } from "@/components/workflow/builder-data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Large faint workflow node-graph drifting behind the hero (2 parallax depths) */
function GraphBackdrop() {
  const layer = (
    seed: number,
    opacity: number,
    duration: string,
    nodes: { x: number; y: number; c: keyof typeof NODE_COLOR_HEX }[],
    edges: [number, number][]
  ) => (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full animate-float-slow"
      style={{ animationDuration: duration }}
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {edges.map(([a, b], i) => (
        <g key={`${seed}-${i}`}>
          <line
            x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke="#94A3B8" strokeOpacity={opacity * 0.4}
          />
          <line
            x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke="#94A3B8" strokeOpacity={opacity} strokeDasharray="3 21"
            className="animate-dash-flow" style={{ animationDuration: `${2.2 + (i % 3)}s` }}
          />
        </g>
      ))}
      {nodes.map((n, i) => (
        <g key={`${seed}-n${i}`}>
          <rect
            x={n.x - 34} y={n.y - 15} width="68" height="30" rx="7"
            fill="#0B0E12" stroke={NODE_COLOR_HEX[n.c]} strokeOpacity={opacity + 0.1}
          />
          <circle cx={n.x - 24} cy={n.y} r="2.5" fill={NODE_COLOR_HEX[n.c]} fillOpacity={opacity + 0.3} />
        </g>
      ))}
    </svg>
  );

  return (
    <>
      {layer(
        1, 0.22, "26s",
        [
          { x: 160, y: 140, c: "data" }, { x: 420, y: 100, c: "warn" },
          { x: 700, y: 160, c: "brand" }, { x: 980, y: 110, c: "data" },
          { x: 560, y: 260, c: "data" }, { x: 880, y: 300, c: "warn" },
        ],
        [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [2, 5]]
      )}
      {layer(
        2, 0.12, "38s",
        [
          { x: 260, y: 460, c: "brand" }, { x: 560, y: 500, c: "data" },
          { x: 860, y: 440, c: "warn" }, { x: 1100, y: 500, c: "brand" },
        ],
        [[0, 1], [1, 2], [2, 3]]
      )}
    </>
  );
}

export default function WorkflowHero() {
  return (
    <section className="relative flex min-h-[75vh] items-center overflow-hidden bg-void">
      <div className="absolute inset-0 blueprint-grid opacity-60" aria-hidden />
      <GraphBackdrop />
      <div className="relative mx-auto w-full max-w-[1280px] px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex justify-center"
        >
          <SectionKicker>WORKFLOW.STUDIO</SectionKicker>
        </motion.div>

        <h1 className="mx-auto mt-6 max-w-4xl font-display text-[42px] font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[68px]">
          <SplitChars
            segments={[
              { text: "Workflows that " },
              { text: "run the floor.", accent: true },
            ]}
            delay={0.15}
            stagger={0.03}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.8, ease: EASE }}
          className="mx-auto mt-6 max-w-[620px] text-lg leading-relaxed text-ink1"
        >
          Compose receiving, putaway, picking, packing and counting as visual
          node graphs. Every node is a screen on a handheld — and a posted
          document in ERPNext.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Build my first workflow</PrimaryButton>
          <a
            href="#templates"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
          >
            Browse templates ↓
          </a>
        </motion.div>
      </div>
    </section>
  );
}
