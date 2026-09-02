import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Weight } from "lucide-react";
import { cartonsPerBin } from "@contracts/wms";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CARTONS = [
  { key: "SMALL", label: "SMALL 300×200×200", dims: { lengthM: 0.3, widthM: 0.2, heightM: 0.2 }, kg: 8 },
  { key: "STD", label: "STD 400×300×300", dims: { lengthM: 0.4, widthM: 0.3, heightM: 0.3 }, kg: 14 },
  { key: "XL", label: "XL 600×400×400", dims: { lengthM: 0.6, widthM: 0.4, heightM: 0.4 }, kg: 22 },
] as const;

const BINS = [
  { key: "HALF", label: "HALF-PALLET", code: "B-01-01-01", dims: { widthM: 1.2, depthM: 1.0, heightM: 1.0 }, maxKg: 250 },
  { key: "STD", label: "STD BIN", code: "B-02-03-01", dims: { widthM: 2.0, depthM: 1.2, heightM: 1.8 }, maxKg: 400 },
  { key: "DEEP", label: "DEEP LANE", code: "C-04-01-02", dims: { widthM: 2.4, depthM: 1.6, heightM: 2.2 }, maxKg: 800 },
] as const;

const CONSTRAINTS = ["ORIENTATION LOCK", "MAX 400 KG", "STACKABLE ×3", "FEFO SINGLE-BATCH", "CRUSH-CLASS B"];

const AXIS_LABEL: Record<string, string> = { lengthM: "L", widthM: "W", heightM: "H" };

/** Rolling number readout (digit flip on change). */
function FlipNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("relative inline-flex overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="inline-block font-tnum"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* Wireframe bin: front face grid = perAxis.x across × perAxis.z high, perAxis.y deep */
function BinWireframe({
  perAxis,
  weightLimited,
}: {
  perAxis: { x: number; y: number; z: number };
  weightLimited: boolean;
}) {
  const { x, y, z } = perAxis;
  const showX = Math.max(1, Math.min(x, 8));
  const showZ = Math.max(1, Math.min(z, 6));
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="relative aspect-[4/3] rounded-md border border-dashed border-linestrong bg-void/50 p-3">
        {/* depth hint */}
        <div className="absolute -right-2 -top-2 h-full w-full rounded-md border border-line/60" aria-hidden />
        <div
          className="grid h-full w-full content-end gap-1"
          style={{
            gridTemplateColumns: `repeat(${showX}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${showZ}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: showX * showZ }, (_, i) => (
            <motion.div
              key={`${x}-${z}-${i}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.35, ease: EASE }}
              className={cn(
                "rounded-[2px] border",
                weightLimited ? "border-warn/50 bg-warn/25" : "border-data/40 bg-data/25"
              )}
            />
          ))}
        </div>
        <span className="absolute bottom-1.5 right-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
          ×{y} deep
        </span>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
        <span>{x} across</span>
        <span>{z} high</span>
      </div>
    </div>
  );
}

function CapacityCalculator() {
  const [cartonIdx, setCartonIdx] = useState(1); // STD default
  const [binIdx, setBinIdx] = useState(1); // STD BIN default

  const carton = CARTONS[cartonIdx];
  const bin = BINS[binIdx];

  const result = useMemo(
    () => cartonsPerBin(bin.dims, carton.dims, bin.maxKg, carton.kg),
    [bin, carton]
  );

  const binVol = bin.dims.widthM * bin.dims.depthM * bin.dims.heightM;
  const cartonVol = carton.dims.lengthM * carton.dims.widthM * carton.dims.heightM;
  const volFill = Math.min(100, (result.count * cartonVol / binVol) * 100);
  const weightUsed = result.count * carton.kg;
  const weightPct = Math.min(100, (weightUsed / bin.maxKg) * 100);

  const fillColor = volFill >= 90 ? "#F4504E" : volFill >= 70 ? "#FFB020" : "#2DD4BF";

  return (
    <BlueprintCard className="p-5 sm:p-6">
      {/* selectors */}
      <div className="space-y-4">
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Carton SKU</div>
          <div className="flex flex-wrap gap-1.5">
            {CARTONS.map((c, i) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCartonIdx(i)}
                className={cn(
                  "rounded-md border px-3 py-1.5 font-mono text-[10px] tracking-[0.08em] transition-colors duration-200",
                  i === cartonIdx
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line text-ink1 hover:border-linestrong hover:text-ink0"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Target bin</div>
          <div className="flex flex-wrap gap-1.5">
            {BINS.map((b, i) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBinIdx(i)}
                className={cn(
                  "rounded-md border px-3 py-1.5 font-mono text-[10px] tracking-[0.08em] transition-colors duration-200",
                  i === binIdx
                    ? "border-data bg-data-soft text-data"
                    : "border-line text-ink1 hover:border-linestrong hover:text-ink0"
                )}
              >
                {b.label} · {b.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* visual + readouts */}
      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
        <BinWireframe perAxis={result.perAxis} weightLimited={result.weightLimited} />
        <div className="flex flex-row items-end gap-8 sm:flex-col sm:items-start sm:justify-center sm:gap-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Fits</div>
            <div className="font-display text-[56px] font-semibold leading-none text-data">
              <FlipNumber value={String(result.count)} />
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">cartons</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Volume</div>
            <div className="font-display text-2xl font-semibold text-ink0">
              <FlipNumber value={`${volFill.toFixed(0)}%`} />
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Load</div>
            <div className="font-display text-2xl font-semibold text-ink0">
              <FlipNumber value={`${weightUsed}`} />
              <span className="text-base text-ink2">/{bin.maxKg} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* bars */}
      <div className="mt-6 space-y-3">
        <div>
          <div className="mb-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
            <span>Volume fill</span>
            <span style={{ color: fillColor }}>{volFill.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raised">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${volFill}%`, backgroundColor: fillColor }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
            <span className="flex items-center gap-1"><Weight className="h-3 w-3" /> Weight</span>
            <span className={cn(result.weightLimited && "text-warn")}>
              {result.weightLimited ? "WEIGHT-LIMITED" : `${weightPct.toFixed(0)}% of rating`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raised">
            <motion.div
              className="h-full rounded-full bg-warn"
              animate={{ width: `${weightPct}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
        </div>
      </div>

      {/* orientation readout */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">
        <span>Best orientation:</span>
        {result.orientation ? (
          <span className="text-ink1">
            {AXIS_LABEL[result.orientation.alongWidth]}→width · {AXIS_LABEL[result.orientation.alongDepth]}→depth · {AXIS_LABEL[result.orientation.alongHeight]}→height
          </span>
        ) : (
          <span className="text-crit">Carton does not fit this bin</span>
        )}
        <span className="ml-auto text-ink2">
          {result.perAxis.x}×{result.perAxis.y}×{result.perAxis.z} grid
        </span>
      </div>
    </BlueprintCard>
  );
}

export default function EngineCapacity() {
  return (
    <section id="engine-capacity" className="scroll-mt-32 bg-void py-24 md:py-40">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-[55%_45%] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="order-2 lg:order-1"
        >
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            <span>Live demo · computed client-side</span>
            <span className="text-data">@contracts/wms</span>
          </div>
          <CapacityCalculator />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="order-1 lg:order-2"
        >
          <SectionKicker>ENGINE.02</SectionKicker>
          <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Capacity is geometry, not guessing." />
          </h2>
          <p className="mt-5 max-w-[52ch] leading-relaxed text-ink1">
            Every bin knows its usable volume, load rating and allowed carton
            orientations. Stackline solves the best-of-six-orientation packing
            per carton SKU and reports exact counts, volume fill and headroom —
            before the goods leave the supplier.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {CONSTRAINTS.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: EASE }}
                className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1"
              >
                {c}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
