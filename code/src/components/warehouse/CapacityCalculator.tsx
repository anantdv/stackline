import { Suspense, lazy, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { SplitWords } from "@/components/SplitText";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/providers/trpc";
import { DEMO_ITEMS } from "@/components/warehouse/data";
import { cn } from "@/lib/utils";

const BinPreviewScene = lazy(
  () => import("@/components/warehouse/BinPreviewScene")
);

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Capacity math (client-side, mirrors @contracts/wms cartonsPerBin    */
/* with rotation/stacking constraints)                                 */
/* ------------------------------------------------------------------ */

interface FitResult {
  count: number;
  grid: { x: number; y: number; z: number };
  /** Oriented carton dims: x along bin width, y along bin depth, z along height */
  oriented: { x: number; y: number; z: number };
  volumeFill: number;
  weightKg: number;
  weightLimited: boolean;
}

function computeFit(
  binMm: { w: number; d: number; h: number },
  cartonMm: { l: number; w: number; h: number },
  opts: { allowRotation: boolean; stackable: boolean },
  maxWeightKg: number,
  cartonWeightKg: number
): FitResult {
  const perms: Array<{ x: number; y: number; z: number }> = [
    { x: cartonMm.l, y: cartonMm.w, z: cartonMm.h },
    { x: cartonMm.w, y: cartonMm.l, z: cartonMm.h },
  ];
  if (opts.allowRotation) {
    perms.push(
      { x: cartonMm.l, y: cartonMm.h, z: cartonMm.w },
      { x: cartonMm.h, y: cartonMm.l, z: cartonMm.w },
      { x: cartonMm.w, y: cartonMm.h, z: cartonMm.l },
      { x: cartonMm.h, y: cartonMm.w, z: cartonMm.l }
    );
  }

  let best: FitResult = {
    count: 0,
    grid: { x: 0, y: 0, z: 0 },
    oriented: perms[0],
    volumeFill: 0,
    weightKg: 0,
    weightLimited: false,
  };

  for (const p of perms) {
    const x = Math.floor(binMm.w / p.x);
    const y = Math.floor(binMm.d / p.y);
    const z = opts.stackable ? Math.floor(binMm.h / p.z) : Math.min(1, Math.floor(binMm.h / p.z));
    const count = x * y * z;
    if (count > best.count) best = { ...best, count, grid: { x, y, z }, oriented: p };
  }

  // Weight cap
  if (best.count > 0 && maxWeightKg > 0 && cartonWeightKg > 0) {
    const byWeight = Math.floor(maxWeightKg / cartonWeightKg);
    if (byWeight < best.count) {
      // Truncate the top layers first
      const per = Math.max(best.grid.x * best.grid.y, 1);
      best = {
        ...best,
        count: Math.max(0, byWeight),
        grid: { ...best.grid, z: Math.max(1, Math.ceil(byWeight / per)) },
        weightLimited: true,
      };
      best.count = Math.min(best.count, best.grid.x * best.grid.y * best.grid.z);
    }
  }

  const cartonVol = cartonMm.l * cartonMm.w * cartonMm.h;
  const binVol = binMm.w * binMm.d * binMm.h;
  best.volumeFill = binVol > 0 ? Math.min(100, (best.count * cartonVol) / binVol * 100) : 0;
  best.weightKg = best.count * cartonWeightKg;
  return best;
}

const BIN_PRESETS = [
  { id: "euro", label: "EURO 800×1200", bin: { w: 1200, d: 800, h: 1000 }, maxWeight: 400 },
  { id: "half", label: "HALF-PALLET", bin: { w: 800, d: 600, h: 600 }, maxWeight: 200 },
  { id: "shelf", label: "SHELF 400×600", bin: { w: 600, d: 400, h: 450 }, maxWeight: 60 },
] as const;

/* ------------------------------------------------------------------ */

function Control({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">{label}</span>
        <span className="font-mono text-[12px] font-tnum text-data">
          {value.toLocaleString()} {unit}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">{label}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="inline-block font-mono text-[14px] font-semibold font-tnum"
          style={{ color: accent ?? "#F4F7FA" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function CapacityCalculator() {
  const [carton, setCarton] = useState({ l: 450, w: 300, h: 250 });
  const [cartonWeight, setCartonWeight] = useState(8);
  const [presetId, setPresetId] = useState<(typeof BIN_PRESETS)[number]["id"]>("euro");
  const [maxWeight, setMaxWeight] = useState(400);
  const [allowRotation, setAllowRotation] = useState(true);
  const [stackable, setStackable] = useState(true);

  // Demo SKUs from the API (fallback: baked-in list)
  const itemsQ = trpc.wms.items.list.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const items = useMemo(() => {
    const live = itemsQ.data;
    return live && live.length > 0 ? live : DEMO_ITEMS;
  }, [itemsQ.data]);

  const preset = BIN_PRESETS.find((p) => p.id === presetId) ?? BIN_PRESETS[0];

  const fit = useMemo(
    () =>
      computeFit(
        preset.bin,
        carton,
        { allowRotation, stackable },
        maxWeight,
        cartonWeight
      ),
    [preset, carton, allowRotation, stackable, maxWeight, cartonWeight]
  );

  const violation = fit.weightLimited;
  const fillColor = fit.volumeFill >= 90 ? "#F4504E" : fit.volumeFill >= 70 ? "#FFB020" : "#2DD4BF";

  return (
    <section className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>TRY.IT</SectionKicker>
        <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="How many cartons fit?" />
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <BlueprintCard className="p-6 md:p-8">
              {/* Load a demo SKU */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                    Load demo SKU
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.1em] text-ink2">
                    {itemsQ.data?.length ? "LIVE CATALOG" : "DEMO CATALOG"}
                  </span>
                </div>
                <Select
                  onValueChange={(sku) => {
                    const it = items.find((i) => i.sku === sku);
                    if (!it) return;
                    setCarton({
                      l: Math.round(it.cartonLengthM * 1000),
                      w: Math.round(it.cartonWidthM * 1000),
                      h: Math.round(it.cartonHeightM * 1000),
                    });
                    setCartonWeight(Math.round(it.cartonWeightKg));
                  }}
                >
                  <SelectTrigger className="w-full border-line bg-surface font-mono text-[12px] text-ink1">
                    <SelectValue placeholder="Pick an item to autofill carton dims…" />
                  </SelectTrigger>
                  <SelectContent className="border-linestrong bg-raised">
                    {items.map((i) => (
                      <SelectItem key={i.sku} value={i.sku} className="font-mono text-[12px]">
                        {i.sku} · {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-5">
                <Control label="Carton length" unit="MM" value={carton.l} min={200} max={800} step={10} onChange={(v) => setCarton((c) => ({ ...c, l: v }))} />
                <Control label="Carton width" unit="MM" value={carton.w} min={200} max={800} step={10} onChange={(v) => setCarton((c) => ({ ...c, w: v }))} />
                <Control label="Carton height" unit="MM" value={carton.h} min={200} max={800} step={10} onChange={(v) => setCarton((c) => ({ ...c, h: v }))} />
                <Control label="Carton weight" unit="KG" value={cartonWeight} min={1} max={40} step={1} onChange={setCartonWeight} />
              </div>

              <div className="mt-7 border-t border-line pt-6">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                  Bin preset
                </div>
                <div className="flex flex-wrap gap-2">
                  {BIN_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPresetId(p.id);
                        setMaxWeight(p.maxWeight);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-2 font-mono text-[11px] tracking-[0.08em] transition-colors",
                        presetId === p.id
                          ? "border-brand bg-brand-soft text-ink0"
                          : "border-line text-ink2 hover:border-linestrong hover:text-ink1"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <Control label="Bin max weight" unit="KG" value={maxWeight} min={20} max={1200} step={20} onChange={setMaxWeight} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    { label: "Allow rotation", value: allowRotation, set: setAllowRotation },
                    { label: "Stackable", value: stackable, set: setStackable },
                  ].map((t) => (
                    <label key={t.label} className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink1">{t.label}</span>
                      <Switch checked={t.value} onCheckedChange={t.set} />
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-void px-4 py-3 font-mono text-[10px] leading-[1.8] tracking-[0.06em] text-ink2">
                FIT = ⌊BL/CL⌋ × ⌊BW/CW⌋ × ⌊BH/CH⌋ (best of 6 orientations)
              </div>
            </BlueprintCard>
          </motion.div>

          {/* Live preview + readouts */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="flex flex-col gap-6"
          >
            <div className="relative overflow-hidden rounded-xl border border-line bg-void">
              <div className="aspect-[4/3] min-h-[320px]">
                <Suspense
                  fallback={
                    <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_45%,#151b23_0%,#07090C_70%)]" />
                  }
                >
                  <BinPreviewScene
                    bin={{ w: preset.bin.w / 1000, d: preset.bin.d / 1000, h: preset.bin.h / 1000 }}
                    carton={{
                      x: fit.oriented.x / 1000,
                      y: fit.oriented.y / 1000,
                      z: fit.oriented.z / 1000,
                    }}
                    grid={fit.grid}
                    count={fit.count}
                    violation={violation}
                  />
                </Suspense>
              </div>
              <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                BIN {preset.label} · {preset.bin.w}×{preset.bin.d}×{preset.bin.h} MM
              </div>
            </div>

            <BlueprintCard className="p-6">
              <Readout label="Fits" value={`${fit.count} CARTONS`} accent={violation ? "#FFB020" : "#F4F7FA"} />
              <Readout label="Volume fill" value={`${Math.round(fit.volumeFill)}%`} accent={fillColor} />
              <Readout
                label="Weight"
                value={`${Math.round(fit.weightKg)} / ${maxWeight} KG`}
                accent={fit.weightKg > maxWeight * 0.9 ? "#FFB020" : "#F4F7FA"}
              />
              <Readout
                label="Grid pattern"
                value={`${fit.grid.x} × ${fit.grid.y} × ${fit.grid.z}`}
                accent="#2DD4BF"
              />
              <AnimatePresence>
                {violation && (
                  <motion.div
                    key={`warn-${fit.count}`}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mt-4 flex items-center gap-3 rounded-lg border border-crit/40 bg-crit/10 px-4 py-3"
                  >
                    <TriangleAlert className="h-4 w-4 shrink-0 text-crit" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-crit">
                      Weight-limited — capped by max load, not volume
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </BlueprintCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
