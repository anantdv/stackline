import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { billingFor } from "@/components/scanning/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const ACTUAL_KG = 12.4;

const DIVISORS = [
  { value: 5000, label: "÷5000 (AIR)" },
  { value: 4000, label: "÷4000 (COURIER)" },
  { value: 6000, label: "÷6000 (SEA LCL)" },
];

function DimSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-14 font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
        {label}
      </span>
      <input
        type="range"
        min={20}
        max={120}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-ew-resize appearance-none rounded-full bg-raised accent-[var(--accent)]"
      />
      <span className="w-16 text-right font-mono text-[12px] text-data font-tnum">
        {value} CM
      </span>
    </label>
  );
}

export default function VolumetricMath() {
  const [l, setL] = useState(60);
  const [w, setW] = useState(40);
  const [h, setH] = useState(38);
  const [divisor, setDivisor] = useState(5000);

  const billing = useMemo(() => billingFor({ l, w, h, actualKg: ACTUAL_KG }, divisor), [l, w, h, divisor]);
  // scale graphic tilt: ±14° toward the heavier side
  const tilt = billing.basis === "volumetric" ? 14 : -14;

  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>HONEST.MATH</SectionKicker>
        <h2 className="mt-6 max-w-[760px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Volumetric weight, explained in one look.
        </h2>

        <div data-tour="volumetric-math" className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          {/* interactive explainer */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <BlueprintCard className="p-6 hover:-translate-y-0">
              <div className="flex flex-col gap-4">
                <DimSlider label="L" value={l} onChange={setL} />
                <DimSlider label="W" value={w} onChange={setW} />
                <DimSlider label="H" value={h} onChange={setH} />
              </div>

              {/* box preview + balance scale */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center justify-center rounded-lg border border-line bg-page/50 p-3">
                  {/* scaling wireframe box */}
                  <svg viewBox="0 0 160 150" className="h-32 w-full">
                    <motion.g
                      animate={{ scale: 0.5 + Math.min(1, (l * w * h) / 288000) * 0.6 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      style={{ transformOrigin: "80px 90px" }}
                    >
                      {[
                        [40, 60, 120, 60], [120, 60, 120, 110], [120, 110, 40, 110], [40, 110, 40, 60],
                        [60, 40, 140, 40], [140, 40, 140, 90], [140, 90, 60, 90], [60, 90, 60, 40],
                        [40, 60, 60, 40], [120, 60, 140, 40], [120, 110, 140, 90], [40, 110, 60, 90],
                      ].map(([x1, y1, x2, y2], i) => (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-data" strokeWidth="1.2" />
                      ))}
                    </motion.g>
                  </svg>
                </div>
                {/* balance scale graphic */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-page/50 p-3">
                  <svg viewBox="0 0 160 110" className="h-28 w-full">
                    <line x1="80" y1="14" x2="80" y2="96" className="stroke-linestrong" strokeWidth="1.5" />
                    <motion.g
                      animate={{ rotate: tilt }}
                      transition={{ duration: 0.5, ease: EASE }}
                      style={{ transformOrigin: "80px 30px" }}
                    >
                      <line x1="24" y1="30" x2="136" y2="30" className="stroke-ink0" strokeWidth="2" />
                      <line x1="30" y1="30" x2="30" y2="52" className="stroke-linestrong" strokeWidth="1" />
                      <line x1="130" y1="30" x2="130" y2="52" className="stroke-linestrong" strokeWidth="1" />
                      <rect x="14" y="52" width="32" height="18" rx="3" className={billing.basis === "actual" ? "fill-brand" : "fill-raised stroke-line"} strokeWidth="1" />
                      <rect x="114" y="52" width="32" height="18" rx="3" className={billing.basis === "volumetric" ? "fill-brand" : "fill-raised stroke-line"} strokeWidth="1" />
                    </motion.g>
                    <text x="30" y="90" textAnchor="middle" className="fill-ink2 font-mono" fontSize="8" letterSpacing="1">ACTUAL</text>
                    <text x="130" y="90" textAnchor="middle" className="fill-ink2 font-mono" fontSize="8" letterSpacing="1">VOL</text>
                  </svg>
                </div>
              </div>

              <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.1em] text-ink1">
                VOL = {(l / 100).toFixed(2)}×{(w / 100).toFixed(2)}×{(h / 100).toFixed(2)} M ÷{" "}
                {divisor} = <span className="text-data font-tnum">{billing.volKg.toFixed(2)} KG</span>
              </p>
              <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.1em]">
                <span className="text-ink2">CHARGEABLE → </span>
                <motion.span
                  key={billing.chargeableKg.toFixed(2) + billing.basis}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-brand font-tnum"
                >
                  {billing.basis.toUpperCase()} {billing.chargeableKg.toFixed(2)} KG
                </motion.span>
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {DIVISORS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDivisor(d.value)}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200",
                      divisor === d.value
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line text-ink2 hover:border-linestrong hover:text-ink1"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </BlueprintCard>
          </motion.div>

          {/* copy */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="lg:pt-6"
          >
            <h3 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink0">
              Carriers bill the bigger number. Know it before they do.
            </h3>
            <p className="mt-4 text-[15px] leading-[1.7] text-ink1">
              Every carrier charges by chargeable weight — the greater of actual
              and volumetric. A mis-measured carton quietly inflates every
              freight invoice it touches. Stackline stores the captured dims on
              the item and parcel record, so quoting, bin-fit and load planning
              all run on the same measured truth.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["FEEDS BIN CAPACITY", "FEEDS LOAD PLANNER", "FEEDS FREIGHT QUOTES"].map((c) => (
                <span
                  key={c}
                  className="rounded-md border border-data/40 bg-data-soft px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-data"
                >
                  {c}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
