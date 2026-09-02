import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { SplitWords } from "@/components/SplitText";
import { Slider } from "@/components/ui/slider";
import { useTwinConfig } from "@/components/warehouse/twin-config";
import SketchImport from "@/components/warehouse/SketchImport";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fmt = (n: number) => n.toLocaleString("en-US");

/* ------------------------------------------------------------------ */
/* Annotated rack-bay SVG with live dimension callouts                 */
/* ------------------------------------------------------------------ */

function RackDiagram({
  bayWidthMm,
  levelHeightMm,
  levels,
  depthMm,
}: {
  bayWidthMm: number;
  levelHeightMm: number;
  levels: number;
  depthMm: number;
}) {
  const W = 420;
  const H = 460;
  const x0 = 70;
  const x1 = 330;
  const yTop = 60;
  const yBot = 380;
  const draw = {
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true, margin: "-15% 0px" },
  } as const;

  const beamYs = Array.from({ length: levels }, (_, i) => {
    const usable = levels - 1 === 0 ? 1 : levels - 1;
    return yTop + ((i + 1) / (usable + 1)) * (yBot - yTop);
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Annotated rack bay diagram">
      {/* Ghost depth (isometric offset) */}
      <motion.g {...draw} transition={{ duration: 0.8, delay: 0.5, ease: EASE }}>
        <rect x={x0 + 34} y={yTop - 34} width={x1 - x0} height={yBot - yTop} fill="none" stroke="rgba(148,163,184,0.14)" strokeDasharray="4 4" />
        {[0, 1].map((i) => (
          <line key={i} x1={i ? x1 : x0} y1={yTop} x2={(i ? x1 : x0) + 34} y2={yTop - 34} stroke="rgba(148,163,184,0.2)" strokeDasharray="3 3" />
        ))}
      </motion.g>

      {/* Uprights */}
      {[x0, x1].map((x, i) => (
        <motion.line key={x} x1={x} y1={yBot + 14} x2={x} y2={yTop} stroke="#39424E" strokeWidth="7" strokeLinecap="round"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: EASE }} />
      ))}
      {/* Base plates */}
      {[x0, x1].map((x) => (
        <line key={`bp-${x}`} x1={x - 12} y1={yBot + 14} x2={x + 12} y2={yBot + 14} stroke="#39424E" strokeWidth="4" />
      ))}

      {/* Beams */}
      {beamYs.map((y, i) => (
        <motion.line key={y} x1={x0} y1={y} x2={x1} y2={y} stroke="#FF6B1A" strokeWidth="5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.6, delay: 0.35 + i * 0.12, ease: EASE }} />
      ))}

      {/* Cartons on lowest levels */}
      {[0, 1].map((row) =>
        [0, 1, 2].map((ci) => (
          <motion.rect
            key={`${row}-${ci}`}
            x={x0 + 26 + ci * ((x1 - x0 - 52) / 3) + 6}
            y={(beamYs[levels - 2 - row] ?? yBot) - 34}
            width={(x1 - x0 - 52) / 3 - 12}
            height="32"
            rx="2"
            fill="#C8A27A"
            opacity={0.85 - row * 0.15}
            initial={{ scale: 0, transformOrigin: "center bottom" }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.5, delay: 0.9 + (row * 3 + ci) * 0.07, ease: EASE }}
          />
        ))
      )}

      {/* Bay width dimension */}
      <motion.g {...draw} transition={{ duration: 0.7, delay: 1.3, ease: EASE }}>
        <line x1={x0} y1={yBot + 34} x2={x1} y2={yBot + 34} stroke="#FF6B1A" strokeWidth="1.5" />
        {[x0, x1].map((x) => (
          <line key={x} x1={x} y1={yBot + 28} x2={x} y2={yBot + 40} stroke="#FF6B1A" strokeWidth="1.5" />
        ))}
      </motion.g>
      <text x={(x0 + x1) / 2} y={yBot + 58} textAnchor="middle" fill="#FF6B1A" fontSize="12" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
        {fmt(bayWidthMm)} MM
      </text>

      {/* Level height dimension */}
      <motion.g {...draw} transition={{ duration: 0.7, delay: 1.45, ease: EASE }}>
        <line x1={x1 + 26} y1={beamYs[0] ?? yTop + 40} x2={x1 + 26} y2={beamYs[1] ?? yBot} stroke="#2DD4BF" strokeWidth="1.5" />
        {[beamYs[0] ?? yTop + 40, beamYs[1] ?? yBot].map((y) => (
          <line key={y} x1={x1 + 20} y1={y} x2={x1 + 32} y2={y} stroke="#2DD4BF" strokeWidth="1.5" />
        ))}
      </motion.g>
      <text x={x1 + 40} y={(beamYs[0] + beamYs[1]) / 2 + 4 || 220} fill="#2DD4BF" fontSize="12" fontFamily="JetBrains Mono, monospace" letterSpacing="2" transform={`rotate(90 ${x1 + 44} ${(beamYs[0] + beamYs[1]) / 2 || 220})`}>
        {fmt(levelHeightMm)} MM
      </text>

      {/* Depth callout (iso corner) */}
      <motion.g {...draw} transition={{ duration: 0.7, delay: 1.6, ease: EASE }}>
        <line x1={x0 + 6} y1={yTop - 8} x2={x0 + 30} y2={yTop - 30} stroke="#9AA7B5" strokeWidth="1.2" />
        <circle cx={x0 + 6} cy={yTop - 8} r="2.5" fill="#9AA7B5" />
      </motion.g>
      <text x={x0 + 38} y={yTop - 26} fill="#9AA7B5" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
        DEPTH {fmt(depthMm)} MM
      </text>

      {/* Load rating */}
      <text x={x0} y={yTop - 44} fill="#5C6773" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
        LOAD / LEVEL 1,200 KG · {levels} LEVELS
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Configurator section                                                */
/* ------------------------------------------------------------------ */

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">{label}</span>
      <span className="font-mono text-[13px] font-tnum text-ink0">{value}</span>
    </div>
  );
}

function FieldSlider({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit?: string;
  value: number;
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
          {fmt(value)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export default function ConfiguratorSection() {
  const { config, setConfig, generateCustomTwin } = useTwinConfig();

  return (
    <section className="bg-page py-24 md:py-40">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        {/* Left: content + configurator */}
        <div>
          <SectionKicker>PARAMETRIC</SectionKicker>
          <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Every millimeter, addressable." />
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-18% 0px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mt-5 max-w-[520px] text-base leading-[1.65] text-ink1"
          >
            Bins aren't labels — they're volumes. Stackline stores usable width
            × height × depth, load rating, allowed orientations and zone rules
            for every cell, so capacity math and allocation run on real
            geometry.
          </motion.p>

          {/* Floor-plan import — real sketch → twin pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-18% 0px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          >
            <SketchImport />
          </motion.div>

          {/* Spec form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-18% 0px" }}
            transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
          >
            <BlueprintCard className="mt-6 p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                  02 Profile — rack spec
                </span>
                <span className="font-mono text-[10px] tracking-[0.1em] text-ink2">
                  {config.rows * config.bays * config.levels} BINS
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <FieldSlider label="Rows" value={config.rows} min={1} max={8} step={1} onChange={(v) => setConfig({ rows: v })} />
                <FieldSlider label="Bays / row" value={config.bays} min={1} max={12} step={1} onChange={(v) => setConfig({ bays: v })} />
                <FieldSlider label="Levels" value={config.levels} min={1} max={6} step={1} onChange={(v) => setConfig({ levels: v })} />
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <FieldSlider label="Bay width" unit="MM" value={config.bayWidthMm} min={1200} max={3600} step={100} onChange={(v) => setConfig({ bayWidthMm: v })} />
                <FieldSlider label="Level height" unit="MM" value={config.levelHeightMm} min={800} max={2200} step={100} onChange={(v) => setConfig({ levelHeightMm: v })} />
                <FieldSlider label="Depth" unit="MM" value={config.depthMm} min={600} max={1600} step={100} onChange={(v) => setConfig({ depthMm: v })} />
              </div>

              <div className="mt-6">
                <SpecRow label="Bay width" value={`${fmt(config.bayWidthMm)} MM`} />
                <SpecRow label="Beam levels" value={`${config.levels} × ${fmt(config.levelHeightMm)} MM`} />
                <SpecRow label="Depth" value={`${fmt(config.depthMm)} MM`} />
                <SpecRow label="Load / level" value="1,200 KG" />
                <SpecRow label="Bin naming" value="ZONE-AISLE-RACK-LEVEL" />
              </div>

              <button
                onClick={() => generateCustomTwin()}
                className="group/btn relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand px-6 py-[13px] font-display text-[15px] font-semibold text-page transition-all duration-300 hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-500 group-hover/btn:left-[120%] group-hover/btn:opacity-100"
                />
                Generate twin — {config.rows}×{config.bays}×{config.levels}
              </button>
              <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                Exports: GLB · IFC · CSV · QR label sheet
              </div>
            </BlueprintCard>
          </motion.div>
        </div>

        {/* Right: annotated diagram */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex items-center"
        >
          <BlueprintCard className="w-full p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                FIG.04 — RACK BAY · FRONT ELEVATION
              </span>
              <span className="font-mono text-[10px] tracking-[0.1em] text-brand">
                SCALE 1:25
              </span>
            </div>
            <RackDiagram
              bayWidthMm={config.bayWidthMm}
              levelHeightMm={config.levelHeightMm}
              levels={config.levels}
              depthMm={config.depthMm}
            />
            <div className="mt-4 flex justify-between border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
              <span>BIN EX. A-04-02-01</span>
              <span className="text-data">PARAMETRIC · LIVE</span>
            </div>
          </BlueprintCard>
        </motion.div>
      </div>
    </section>
  );
}
