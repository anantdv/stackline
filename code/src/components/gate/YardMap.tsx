import { useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { DEMO_STAGING_OCCUPANCY } from "@/components/gate/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface YardVehicle {
  id: string;
  plate: string;
  /** SVG path from gate → staging → dock */
  path: string;
  begin: string;
  info: string;
}

const VEHICLES: YardVehicle[] = [
  {
    id: "v1",
    plate: "GJ-01-AB-4421",
    path: "M 60 620 C 160 620 200 560 260 520 S 420 430 470 380 S 560 250 600 150",
    begin: "0s",
    info: "TRK-07 · LOADED 91% · DEP 15:40 → /fleet",
  },
  {
    id: "v2",
    plate: "MH-04-CD-8812",
    path: "M 60 620 C 140 620 220 540 300 470 S 460 340 540 330 S 660 300 700 150",
    begin: "-2.6s",
    info: "TRK-12 · ASN-0115 · DOCK D-04",
  },
  {
    id: "v3",
    plate: "TN-09-KL-7702",
    path: "M 60 620 C 120 620 180 580 240 560 S 420 470 500 460 S 740 420 800 150",
    begin: "-5.2s",
    info: "TRK-03 · STAGING Y-10 · WAIT 41M",
  },
];

const STAGING_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const code = `Y-${String(i + 1).padStart(2, "0")}`;
  const col = i % 4;
  const row = Math.floor(i / 4);
  return { code, x: 300 + col * 130, y: 400 + row * 75 };
});

const DOCKS = Array.from({ length: 8 }, (_, i) => ({
  code: `D-${String(i + 1).padStart(2, "0")}`,
  x: 240 + i * 108,
  y: 96,
}));

export default function YardMap() {
  const [hovered, setHovered] = useState<YardVehicle | null>(null);
  const occupied = Object.values(DEMO_STAGING_OCCUPANCY).filter(Boolean).length;
  const yardPct = Math.round((occupied / 12) * 100);

  return (
    <section className="bg-void py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>YARD.VIEW</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          The yard, from above.
        </h2>

        <motion.div
          data-tour="yard-map"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="group relative mt-12 rounded-xl border border-line bg-surface p-4 transition-colors duration-300 hover:border-linestrong md:p-6"
        >
          <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-[14px] w-[14px] border-l border-t border-brand" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[14px] w-[14px] border-b border-r border-brand" />

          <svg viewBox="0 0 1100 680" className="h-auto w-full" role="img" aria-label="Top-down yard map">
            {/* boundary */}
            <rect x="20" y="20" width="1060" height="640" fill="none" className="stroke-line" strokeWidth="1" />
            {/* dock wall */}
            <rect x="200" y="60" width="880" height="44" className="fill-raised stroke-line" strokeWidth="1" />
            <text x="210" y="50" className="fill-ink2 font-mono" fontSize="10" letterSpacing="2">
              DOCK WALL · WH-MUM-01 SOUTH FACE
            </text>
            {DOCKS.map((d) => (
              <g key={d.code}>
                <rect x={d.x} y={d.y + 20} width="76" height="26" fill="none" className="stroke-linestrong" strokeWidth="1" />
                <text x={d.x + 38} y={d.y + 37} textAnchor="middle" className="fill-ink1 font-mono" fontSize="9" letterSpacing="1">
                  {d.code}
                </text>
              </g>
            ))}
            {/* staging slots */}
            <text x="300" y="384" className="fill-ink2 font-mono" fontSize="10" letterSpacing="2">
              STAGING
            </text>
            {STAGING_SLOTS.map((s) => {
              const occ = DEMO_STAGING_OCCUPANCY[s.code];
              return (
                <g key={s.code}>
                  <rect
                    x={s.x}
                    y={s.y}
                    width="108"
                    height="56"
                    fill="none"
                    strokeWidth="1"
                    strokeDasharray="5 4"
                    className={occ ? "stroke-warn/70" : "stroke-line"}
                  />
                  <text x={s.x + 6} y={s.y + 16} className={cn("font-mono", occ ? "fill-warn" : "fill-ink2")} fontSize="9" letterSpacing="1">
                    {s.code}
                  </text>
                  {occ && (
                    <text x={s.x + 6} y={s.y + 44} className="fill-ink1 font-mono" fontSize="8" letterSpacing="0.5">
                      {occ}
                    </text>
                  )}
                </g>
              );
            })}
            {/* approach road */}
            <path d="M 40 600 L 40 660 L 1060 660" fill="none" className="stroke-linestrong" strokeWidth="1.5" />
            <path d="M 60 630 L 1040 630" fill="none" className="stroke-line" strokeWidth="26" opacity="0.5" />
            <text x="70" y="652" className="fill-ink2 font-mono" fontSize="9" letterSpacing="2">
              APPROACH ROAD · NH-48
            </text>
            {/* gate booths */}
            {[
              { x: 300, label: "GATE 1 IN", tone: "fill-data" },
              { x: 560, label: "GATE 2 OUT", tone: "fill-brand" },
              { x: 820, label: "GATE 3 BOTH", tone: "fill-warn" },
            ].map((g) => (
              <g key={g.label}>
                <rect x={g.x} y={598} width="18" height="18" className={cn(g.tone, "opacity-80")} />
                <text x={g.x + 26} y={612} className="fill-ink1 font-mono" fontSize="9" letterSpacing="1">
                  {g.label}
                </text>
              </g>
            ))}
            {/* vehicle paths (guide lines) */}
            {VEHICLES.map((v) => (
              <path key={`p-${v.id}`} d={v.path} fill="none" className="stroke-data/25" strokeWidth="1" strokeDasharray="3 6" />
            ))}
            {/* vehicles gliding gate → staging → dock */}
            {VEHICLES.map((v) => (
              <g
                key={v.id}
                onMouseEnter={() => setHovered(v)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-crosshair"
              >
                <rect x="-22" y="-11" width="44" height="22" rx="3" className="fill-brand/90" />
                <text x="0" y="4" textAnchor="middle" className="fill-onbrand font-mono" fontSize="8" letterSpacing="0.5">
                  {v.plate.slice(0, 10)}
                </text>
                <animateMotion dur="8s" begin={v.begin} repeatCount="indefinite" path={v.path} />
              </g>
            ))}
          </svg>

          {/* tooltip */}
          {hovered && (
            <div className="pointer-events-none absolute right-4 top-4 rounded-lg border border-linestrong bg-raised px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink0 shadow-xl">
              {hovered.info}
            </div>
          )}

          {/* yard utilization strip */}
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
              <span className="text-ink2">YARD UTILIZATION</span>
              <span className={yardPct >= 90 ? "text-crit" : yardPct >= 70 ? "text-warn" : "text-data"}>
                YARD {yardPct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-raised">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${yardPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE }}
                className={cn(
                  "h-full rounded-full",
                  yardPct >= 90 ? "bg-crit" : yardPct >= 70 ? "bg-warn" : "bg-data"
                )}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
