import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ENGINE_ANCHORS = [
  { id: "engine-movement", n: "01", label: "MOVEMENT" },
  { id: "engine-capacity", n: "02", label: "CAPACITY" },
  { id: "engine-allocation", n: "03", label: "ALLOCATION" },
  { id: "engine-workflow", n: "04", label: "WORKFLOW" },
] as const;

/** Faint drifting node-path lines behind the hero (teal dashes). */
function PathBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {[
        "M-40 480 C 240 420, 420 520, 700 440 S 1120 360, 1260 420",
        "M-40 300 C 200 360, 520 220, 820 300 S 1140 240, 1260 280",
        "M-40 140 C 260 200, 480 80, 760 150 S 1100 110, 1260 160",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#2DD4BF" strokeOpacity={0.16 - i * 0.03} strokeWidth="1" />
          <path
            d={d}
            stroke="#2DD4BF"
            strokeOpacity={0.5 - i * 0.1}
            strokeWidth="1.5"
            strokeDasharray="4 20"
            className="animate-dash-flow"
            style={{ animationDuration: `${2.4 + i * 0.9}s` }}
          />
          {/* nodes */}
          {[0.18, 0.52, 0.84].map((t, j) => (
            <circle
              key={j}
              r="3"
              cx={-40 + t * 1300}
              cy={i === 0 ? 480 - t * 60 : i === 1 ? 300 - t * 20 : 140 + t * 10}
              fill="#0B0E12"
              stroke="#2DD4BF"
              strokeOpacity="0.55"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

export default function FeaturesHero() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-void">
      <div className="absolute inset-0 blueprint-grid opacity-60" aria-hidden />
      <PathBackdrop />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-[1280px] px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex justify-center"
        >
          <SectionKicker>CORE.ENGINES</SectionKicker>
        </motion.div>

        <h1 className="mx-auto mt-6 max-w-4xl font-display text-[44px] font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[72px]">
          <SplitChars
            segments={[
              { text: "Four engines. " },
              { text: "One spatial ledger.", accent: true },
            ]}
            delay={0.15}
            stagger={0.028}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.8, ease: EASE }}
          className="mx-auto mt-6 max-w-[620px] text-lg leading-relaxed text-ink1"
        >
          Move stock by dragging it. Know bin capacity before you ship. Let the
          engine allocate every carton. Run the floor on visual workflows — all
          mirrored to ERPNext.
        </motion.p>
      </div>
    </section>
  );
}
