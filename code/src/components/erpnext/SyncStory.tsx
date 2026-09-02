import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import SectionKicker from "@/components/SectionKicker";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    n: "01",
    name: "MODEL",
    title: "Warehouses become geometry.",
    copy: "Your warehouse tree maps to zones, aisles, racks and levels. Existing bins import as volumes — with dimensions you define once.",
  },
  {
    n: "02",
    name: "MOVE",
    title: "Gestures become documents.",
    copy: "Every drag in the twin submits a real Stock Entry — with naming series, permissions and validation from your own site.",
  },
  {
    n: "03",
    name: "VERIFY",
    title: "The ledger is the truth.",
    copy: "Continuous reconciliation compares the twin against Stock Ledger Entries. Divergence beyond 0.02% flags a bin for targeted cycle count.",
  },
];

/* Step 1: warehouse tree extruding into isometric rack rows */
function ModelVisual() {
  const tree = ["All Warehouses", "├─ Main DC", "│  ├─ Zone A", "│  └─ Zone B", "└─ Stores"];
  return (
    <div className="grid h-full w-full grid-cols-[1fr_1.4fr] items-center gap-4 p-6">
      <div className="space-y-1.5">
        {tree.map((row, i) => (
          <motion.div
            key={row}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: EASE }}
            className="whitespace-pre rounded border border-line bg-raised px-2.5 py-1.5 font-mono text-[10px] tracking-[0.06em] text-ink1"
          >
            {row}
          </motion.div>
        ))}
      </div>
      <svg viewBox="0 0 260 190" className="h-full w-full">
        {Array.from({ length: 4 }, (_, r) => {
          const y = 40 + r * 34;
          return (
            <motion.g
              key={r}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.4 + r * 0.14, duration: 0.5, ease: EASE }}
              style={{ transformOrigin: `130px ${y + 30}px` }}
            >
              <polygon
                points={`40,${y + 16} 200,${y - 22} 208,${y - 17} 48,${y + 21}`}
                fill="#FF6B1A"
                fillOpacity={0.45}
              />
              <polygon
                points={`40,${y + 16} 48,${y + 21} 48,${y + 33} 40,${y + 28}`}
                fill="#39424E"
                fillOpacity={0.9}
              />
              <polygon
                points={`48,${y + 21} 208,${y - 17} 208,${y - 5} 48,${y + 33}`}
                fill="#1A2029"
                fillOpacity={0.95}
              />
            </motion.g>
          );
        })}
        <text x={130} y={184} textAnchor="middle" fill="#5C6773" fontSize={9} letterSpacing={1.6} fontFamily="'JetBrains Mono', monospace">
          ZONE → AISLE → RACK → LEVEL → BIN
        </text>
      </svg>
    </div>
  );
}

/* Step 2: carton arc + self-printing Stock Entry document */
const DOC_FIELDS: Array<[string, string, boolean]> = [
  ["doctype", "Stock Entry", false],
  ["stock_entry_type", "Material Transfer", false],
  ["from_warehouse", "Zone A - MD", false],
  ["to_warehouse", "Zone B - MD", false],
  ["item_code", "SKU-1002", false],
  ["qty", "24", true],
  ["batch_no", "B-2025-041", false],
];

function MoveVisual() {
  return (
    <div className="relative grid h-full w-full grid-rows-[1fr_auto] gap-3 p-6">
      {/* carton arc between bins */}
      <svg viewBox="0 0 260 90" className="w-full">
        <rect x={16} y={52} width={52} height={26} rx={3} fill="none" stroke="#FF6B1A" strokeOpacity={0.6} />
        <rect x={192} y={52} width={52} height={26} rx={3} fill="none" stroke="#2DD4BF" strokeOpacity={0.6} />
        <path d="M 42 52 Q 130 -18 218 52" fill="none" stroke="#2DD4BF" strokeOpacity={0.35} strokeDasharray="4 5" className="animate-dash-flow" />
        <motion.rect
          width={10}
          height={8}
          rx={1.5}
          fill="#C8A27A"
          stroke="#FF6B1A"
          strokeWidth={0.6}
          initial={false}
          animate={{
            x: [37, 82, 125, 170, 213],
            y: [44, 16, 6, 16, 44],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear", times: [0, 0.25, 0.5, 0.75, 1] }}
        />
        <text x={42} y={88} textAnchor="middle" fill="#5C6773" fontSize={8} fontFamily="'JetBrains Mono', monospace">A-04-02-03</text>
        <text x={218} y={88} textAnchor="middle" fill="#5C6773" fontSize={8} fontFamily="'JetBrains Mono', monospace">B-02-03-01</text>
      </svg>
      {/* document card prints field-by-field */}
      <div className="rounded-lg border border-line bg-void p-4">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
          <span className="text-ink1">STOCK ENTRY · MATERIAL TRANSFER</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: DOC_FIELDS.length * 0.15 + 0.2 }}
            className="rounded border border-data/40 bg-data-soft px-2 py-0.5 text-data"
          >
            SUBMITTED
          </motion.span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
          {DOC_FIELDS.map(([k, v, accent], i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.3, ease: EASE }}
              className="flex items-baseline justify-between gap-3 font-mono text-[10px]"
            >
              <span className="text-ink2">{k}</span>
              <span className={accent ? "text-brand" : "text-data"}>{v}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Step 3: ledger reconciliation, rows check off */
const LEDGER_ROWS = [
  ["A-04-02-03", "SKU-1002", "128", "128"],
  ["A-04-02-04", "SKU-1004", "300", "300"],
  ["B-02-03-01", "SKU-1001", "240", "240"],
  ["B-02-03-02", "SKU-1005", "88", "88"],
];

function VerifyVisual() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-4 p-6">
      <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-x-4 border-b border-line pb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
        <span>Bin</span><span>Item</span><span>Twin</span><span>Ledger</span><span />
      </div>
      {LEDGER_ROWS.map((row, i) => (
        <div key={row[0]} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] items-center gap-x-4 font-mono text-[11px]">
          <span className="text-ink0">{row[0]}</span>
          <span className="text-ink1">{row[1]}</span>
          <span className="text-ink1 font-tnum">{row[2]}</span>
          <span className="text-ink1 font-tnum">{row[3]}</span>
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.18, duration: 0.3, ease: EASE }}
            className="flex h-4 w-4 items-center justify-center rounded-full border border-data/50 bg-data-soft text-[9px] text-data"
          >
            ✓
          </motion.span>
        </div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 + LEDGER_ROWS.length * 0.18 + 0.2 }}
        className="mt-2 flex items-center justify-between rounded border border-data/30 bg-data-soft px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-data"
      >
        <span>Divergence 0.00%</span>
        <span>Threshold ±0.02%</span>
      </motion.div>
    </div>
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
    index === 0 ? [1, 1, 1, 0] : index === 2 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      {children}
    </motion.div>
  );
}

export default function SyncStory() {
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
    <section ref={ref} className="relative h-[300vh] bg-void">
      <div className="sticky top-0 flex min-h-[100dvh] items-center overflow-hidden blueprint-grid">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 py-16 lg:grid-cols-[340px_1fr]">
          {/* Step rail */}
          <div className="relative z-10 flex flex-col gap-9">
            <SectionKicker className="mb-1">SYNC.PIPELINE</SectionKicker>
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative flex gap-5">
                {i < STEPS.length - 1 && (
                  <span className="absolute left-[15px] top-10 h-[calc(100%+12px)] w-px bg-line" aria-hidden />
                )}
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-all duration-300 ${
                    active === i
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line bg-void text-ink2"
                  }`}
                  style={{ transform: active === i ? "translateX(8px)" : undefined }}
                >
                  {s.n}
                </span>
                <div className={`transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-40"}`}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand">{s.name}</div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-ink0 md:text-2xl">{s.title}</h3>
                  <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-ink1">{s.copy}</p>
                </div>
              </div>
            ))}
            <div className="ml-4 h-1 w-24 overflow-hidden rounded bg-line">
              <motion.div className="h-full bg-brand" style={{ width: railFill }} />
            </div>
          </div>

          {/* Morphing scene panel */}
          <div className="relative hidden aspect-[4/3] rounded-xl border border-line bg-surface/60 sm:block">
            <StepLayer progress={scrollYProgress} index={0}>
              <ModelVisual />
            </StepLayer>
            <StepLayer progress={scrollYProgress} index={1}>
              {active === 1 ? <MoveVisual /> : <div className="h-full w-full" />}
            </StepLayer>
            <StepLayer progress={scrollYProgress} index={2}>
              {active === 2 ? <VerifyVisual /> : <div className="h-full w-full" />}
            </StepLayer>
            <span className="absolute bottom-3 left-4 font-mono text-[10px] tracking-[0.14em] text-ink2">
              {STEPS[active].n} / 03 — {STEPS[active].name}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
