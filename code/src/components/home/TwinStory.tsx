import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import SectionKicker from "@/components/SectionKicker";

const STEPS = [
  {
    n: "01",
    name: "UPLOAD",
    title: "Drop in your floor plan.",
    copy: "PDF, DWG, CSV or a hand sketch. Stackline parses walls, columns and dock doors automatically.",
  },
  {
    n: "02",
    name: "GENERATE",
    title: "Racks and bins, parametrically.",
    copy: "Define rack profiles once — beam heights, bay widths, weight limits — and generate thousands of addressable bins in seconds.",
  },
  {
    n: "03",
    name: "SYNC",
    title: "Live from ERPNext.",
    copy: "Warehouses, bins and stock levels mirror ERPNext in real time. What you see is what the ledger says.",
  },
];

/* Flat blueprint floor plan (step 1) */
function BlueprintVisual() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <rect x="40" y="40" width="320" height="220" fill="none" stroke="#2DD4BF" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="6 4" />
      <rect x="70" y="70" width="120" height="70" fill="none" stroke="#94A3B8" strokeOpacity="0.5" />
      <rect x="210" y="70" width="120" height="160" fill="none" stroke="#94A3B8" strokeOpacity="0.35" />
      {/* dock doors */}
      <rect x="150" y="256" width="30" height="8" fill="#FF6B1A" fillOpacity="0.7" />
      <rect x="200" y="256" width="30" height="8" fill="#FF6B1A" fillOpacity="0.7" />
      <rect x="250" y="256" width="30" height="8" fill="#FF6B1A" fillOpacity="0.7" />
      {/* dimension line top */}
      <line x1="40" y1="24" x2="360" y2="24" stroke="#5C6773" strokeWidth="1" />
      <line x1="40" y1="18" x2="40" y2="30" stroke="#5C6773" strokeWidth="1" />
      <line x1="360" y1="18" x2="360" y2="30" stroke="#5C6773" strokeWidth="1" />
      <text x="200" y="18" textAnchor="middle" fill="#5C6773" fontSize="10" fontFamily="JetBrains Mono, monospace">2400 MM</text>
      <text x="30" y="285" fill="#5C6773" fontSize="10" fontFamily="JetBrains Mono, monospace">1200 × 1000 PALLET</text>
    </svg>
  );
}

/* Isometric rack rows (steps 2 & 3) */
function IsoRacks({ synced }: { synced?: boolean }) {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      {Array.from({ length: 6 }, (_, r) => {
        const y = 70 + r * 32;
        return (
          <g key={r}>
            <polygon
              points={`80,${y + 20} 320,${y - 30} 330,${y - 24} 90,${y + 26}`}
              fill={synced ? "#2DD4BF" : "#FF6B1A"}
              fillOpacity={synced ? 0.35 : 0.5}
            />
            <polygon
              points={`80,${y + 20} 90,${y + 26} 90,${y + 40} 80,${y + 34}`}
              fill="#39424E"
              fillOpacity="0.9"
            />
            <polygon
              points={`90,${y + 26} 330,${y - 24} 330,${y - 10} 90,${y + 40}`}
              fill="#1A2029"
              fillOpacity="0.95"
            />
            {synced &&
              Array.from({ length: 8 }, (_, b) => (
                <rect
                  key={b}
                  x={96 + b * 28}
                  y={y + 16 - b * 6.2}
                  width="14"
                  height="9"
                  fill="#C8A27A"
                  fillOpacity={0.5 + ((r * 8 + b) % 5) * 0.12}
                  transform={`skewY(-12)`}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              ))}
          </g>
        );
      })}
      {synced && (
        <>
          <circle cx="200" cy="140" r="8" fill="none" stroke="#2DD4BF" strokeWidth="1.5" className="animate-[ripple_2.4s_ease-out_infinite]" />
          <circle cx="200" cy="140" r="8" fill="none" stroke="#2DD4BF" strokeWidth="1.5" className="animate-[ripple_2.4s_ease-out_1.2s_infinite]" />
        </>
      )}
    </svg>
  );
}

function StepLayer({
  progress,
  index,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  children: React.ReactNode;
}) {
  const start = index / 3;
  const end = (index + 1) / 3;
  const pad = 0.06;
  const opacity = useTransform(
    progress,
    [Math.max(0, start - pad), start + pad, end - pad, Math.min(1, end + pad)],
    index === 0 ? [1, 1, 1, 0] : index === 2 ? [0, 1, 1, 1] : [0, 1, 1, 0]
  );
  const scale = useTransform(progress, [start, end], [1.04, 1]);
  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
}

export default function TwinStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(2, Math.floor(v * 3)));
  });
  const railFill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="twin" ref={ref} className="relative h-[300vh] bg-void">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden blueprint-grid">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-[320px_1fr]">
          {/* Step rail */}
          <div className="relative z-10 flex flex-col gap-10">
            <SectionKicker className="mb-2">FLOORPLAN.TO.TWIN</SectionKicker>
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative flex gap-5">
                {i < STEPS.length - 1 && (
                  <span className="absolute left-[15px] top-10 h-[calc(100%+8px)] w-px bg-line" aria-hidden />
                )}
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-all duration-300 ${
                    active === i
                      ? "border-brand bg-brand/10 text-brand -translate-x-0"
                      : "border-line bg-void text-ink2"
                  }`}
                  style={{ transform: active === i ? "translateX(8px)" : undefined }}
                >
                  {s.n}
                </span>
                <div
                  className={`transition-opacity duration-300 ${
                    active === i ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand">
                    {s.name}
                  </div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-ink0 md:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-ink1">
                    {s.copy}
                  </p>
                </div>
              </div>
            ))}
            {/* progress connector */}
            <div className="ml-4 h-1 w-24 overflow-hidden rounded bg-line">
              <motion.div
                className="h-full bg-brand"
                style={{ width: railFill }}
              />
            </div>
          </div>

          {/* Morphing scene */}
          <div className="relative hidden aspect-[4/3] rounded-xl border border-line bg-surface/60 sm:block">
            <StepLayer progress={scrollYProgress} index={0}>
              <BlueprintVisual />
            </StepLayer>
            <StepLayer progress={scrollYProgress} index={1}>
              <IsoRacks />
            </StepLayer>
            <StepLayer progress={scrollYProgress} index={2}>
              <div className="relative h-full w-full">
                <IsoRacks synced />
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-data/40 bg-data-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-data">
                  <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" />
                  ERPNext Connected
                </div>
              </div>
            </StepLayer>
            {/* corner coords */}
            <span className="absolute bottom-3 left-4 font-mono text-[10px] tracking-[0.14em] text-ink2">
              {STEPS[active].n} / 03 — {STEPS[active].name}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
