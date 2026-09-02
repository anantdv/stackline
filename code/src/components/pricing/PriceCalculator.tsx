import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { PrimaryButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  EASE,
  FlipDigits,
  TIERS,
  formatBins,
  tierForBins,
  type Billing,
} from "@/components/pricing/shared";

/* ------------------------------------------------------------------ */
/* Live isometric rack visualization (front face + depth silhouettes)  */
/* ------------------------------------------------------------------ */

const VB_W = 560;
const VB_H = 340;
const MAX_FACE_BAYS = 16;
const MAX_LEVELS = 8;
const MAX_DEPTH = 6;
const DEPTH_STEP = 10;

function RackViz({ rows, bays, levels }: { rows: number; bays: number; levels: number }) {
  const B = Math.min(bays, MAX_FACE_BAYS);
  const L = Math.min(levels, MAX_LEVELS);
  const R = Math.min(rows, MAX_DEPTH);

  const faceW = 380;
  const faceH = 230;
  const ox = 140; // front-face origin x (leaves room on the left for depth)
  const oy = 60;

  const cellW = faceW / B;
  const cellH = faceH / L;
  const dotR = Math.max(2, Math.min(cellW, cellH) * 0.22);

  const spring = { type: "spring" as const, stiffness: 170, damping: 24 };

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Rack visualization: ${rows} rows by ${bays} bays by ${levels} levels`}
    >
      {/* floor line */}
      <line x1={20} y1={oy + faceH + 18} x2={VB_W - 20} y2={oy + faceH + 18} stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={i}
          x1={40 + i * 60}
          y1={oy + faceH + 14}
          x2={40 + i * 60}
          y2={oy + faceH + 22}
          stroke="rgba(148,163,184,0.3)"
          strokeWidth={1}
        />
      ))}

      {/* depth silhouettes (behind front face) */}
      {Array.from({ length: R - 1 }).map((_, i) => {
        const d = (R - 1 - i) * DEPTH_STEP;
        const opacity = 0.32 - i * 0.05;
        return (
          <motion.g
            key={`depth-${i}-${R}`}
            initial={false}
            animate={{ x: ox - d, y: oy - d, opacity }}
            transition={spring}
          >
            <rect x={0} y={0} width={faceW} height={faceH} fill="none" stroke="#FF6B1A" strokeWidth={1} />
            <line x1={0} y1={faceH * 0.5} x2={faceW} y2={faceH * 0.5} stroke="#FF6B1A" strokeWidth={0.75} />
          </motion.g>
        );
      })}

      {/* front face: beams + uprights + bin dots */}
      <motion.g initial={false} animate={{ x: ox, y: oy }} transition={spring}>
        {/* level beams */}
        {Array.from({ length: L + 1 }).map((_, i) => (
          <motion.line
            key={`beam-${i}`}
            initial={false}
            animate={{ x1: 0, x2: faceW, y1: i * cellH, y2: i * cellH }}
            transition={spring}
            stroke="#FF6B1A"
            strokeWidth={i === 0 || i === L ? 2 : 1}
            strokeOpacity={i === 0 || i === L ? 1 : 0.75}
          />
        ))}
        {/* bay uprights */}
        {Array.from({ length: B + 1 }).map((_, i) => (
          <motion.line
            key={`up-${i}`}
            initial={false}
            animate={{ y1: 0, y2: faceH, x1: i * cellW, x2: i * cellW }}
            transition={spring}
            stroke="#FF6B1A"
            strokeWidth={i === 0 || i === B ? 2 : 0.75}
            strokeOpacity={i === 0 || i === B ? 1 : 0.6}
          />
        ))}
        {/* bin dots */}
        {Array.from({ length: B * L }).map((_, i) => {
          const bx = i % B;
          const lv = Math.floor(i / B);
          return (
            <motion.rect
              key={`bin-${i}`}
              initial={false}
              animate={{
                x: bx * cellW + cellW / 2 - dotR,
                y: lv * cellH + cellH / 2 - dotR,
                width: dotR * 2,
                height: dotR * 2,
              }}
              transition={{ ...spring, delay: (i % 24) * 0.008 }}
              fill="#2DD4BF"
              fillOpacity={0.85}
              rx={1}
            />
          );
        })}
      </motion.g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                             */
/* ------------------------------------------------------------------ */

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">{label}</span>
        <span className="font-mono text-sm font-medium text-data font-tnum">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      />
      <div className="flex justify-between font-mono text-[10px] text-ink2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-linestrong text-ink1 transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-linestrong disabled:hover:text-ink1"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-12 text-center font-mono text-lg font-medium text-ink0 font-tnum">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-linestrong text-ink1 transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-linestrong disabled:hover:text-ink1"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calculator section                                                   */
/* ------------------------------------------------------------------ */

export default function PriceCalculator({ billing }: { billing: Billing }) {
  const [rows, setRows] = useState(6);
  const [bays, setBays] = useState(8);
  const [levels, setLevels] = useState(4);
  const [warehouses, setWarehouses] = useState(1);
  const [users, setUsers] = useState(12);

  const bins = rows * bays * levels * warehouses;
  const tierId = tierForBins(bins);
  const tier = TIERS[tierId];
  const price = billing === "monthly" ? tier.monthly : tier.annual;
  const headroom = tier.headroom;

  const capacityPct = useMemo(() => {
    if (headroom === Infinity) return Math.min(bins / 60000, 1);
    return Math.min(bins / headroom, 1);
  }, [bins, headroom]);

  const barColor =
    headroom === Infinity || capacityPct < 0.7
      ? "bg-data"
      : capacityPct < 0.9
        ? "bg-warn"
        : "bg-crit";

  const query = `?tier=${tier.id}&bins=${bins}&rows=${rows}&bays=${bays}&levels=${levels}&warehouses=${warehouses}&users=${users}&billing=${billing}`;

  return (
    <section className="blueprint-grid relative overflow-hidden bg-void px-6 py-24 md:py-[160px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_30%,transparent_0%,#07090C_100%)]"
      />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-4">
          <SectionKicker>SIZE.IT.UP</SectionKicker>
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Count your bins. Get your price." />
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <BlueprintCard className="flex h-full flex-col gap-8 p-8 hover:-translate-y-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">
                  Configuration
                </span>
                <span className="font-mono text-sm uppercase tracking-[0.14em] text-ink0">
                  ={" "}
                  <FlipDigits text={formatBins(bins)} className="text-data" />{" "}
                  <span className="text-ink2">bins</span>
                </span>
              </div>

              <SliderControl label="Rack rows" value={rows} min={1} max={40} onChange={setRows} />
              <SliderControl label="Bays per row" value={bays} min={2} max={20} onChange={setBays} />
              <SliderControl label="Levels" value={levels} min={1} max={8} onChange={setLevels} />

              <div className="grid grid-cols-2 gap-6">
                <Stepper label="Warehouses" value={warehouses} min={1} max={10} onChange={setWarehouses} />
                <Stepper label="Users" value={users} min={1} max={200} onChange={setUsers} />
              </div>

              <div className="mt-auto flex items-center gap-3 border-t border-line pt-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink2">
                  Recommended:
                </span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={tier.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]",
                      tier.id === "scale"
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-linestrong text-ink0"
                    )}
                  >
                    {tier.name}
                  </motion.span>
                </AnimatePresence>
              </div>
            </BlueprintCard>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          >
            <BlueprintCard className="flex h-full flex-col gap-6 p-8 hover:-translate-y-0">
              <div className="rounded-lg border border-line bg-void/60 p-2">
                <RackViz rows={rows} bays={bays} levels={levels} />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                <span>
                  {rows}R × {bays}B × {levels}L × {warehouses}WH
                </span>
                {(rows > MAX_DEPTH || bays > MAX_FACE_BAYS) && (
                  <span>
                    Showing {Math.min(rows, MAX_DEPTH)}×{Math.min(bays, MAX_FACE_BAYS)} face
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {price !== null ? (
                  <>
                    <span className="font-display text-[56px] font-semibold leading-none tracking-tight text-ink0">
                      <FlipDigits text={`$${price}`} />
                    </span>
                    <span className="font-mono text-sm uppercase tracking-[0.14em] text-ink2">/mo</span>
                  </>
                ) : (
                  <span className="font-display text-[56px] font-semibold leading-none tracking-tight text-ink0">
                    CUSTOM
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink2">
                {price !== null
                  ? `Billed ${billing} · ${headroom.toLocaleString("en-US")} bin headroom`
                  : "Volume pricing · unlimited bin headroom"}
              </p>

              {/* capacity bar */}
              <div className="flex flex-col gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-raised">
                  <motion.div
                    className={cn("h-full rounded-full", barColor)}
                    initial={false}
                    animate={{ width: `${Math.max(capacityPct * 100, 2)}%` }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                  <span className="font-tnum">{formatBins(bins)} bins used</span>
                  <span>
                    {headroom === Infinity ? "Unlimited headroom" : `${formatBins(headroom)} headroom`}
                  </span>
                </div>
              </div>

              <PrimaryButton to={`/contact${query}`} className="mt-2 w-full">
                Lock this configuration
              </PrimaryButton>
            </BlueprintCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
