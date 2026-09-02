import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Radiation, Ruler, Scale } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STATIONS = [
  {
    id: "INDUCT",
    icon: LogIn,
    x: 130,
    body: "Parcels inducted from receiving or the packing line; barcode read fixes identity.",
  },
  {
    id: "X-RAY",
    icon: Radiation,
    x: 390,
    body: "Dual-energy scan builds a density map of contents; matches against the declared item.",
  },
  {
    id: "DIMENSION",
    icon: Ruler,
    x: 650,
    body: "Laser/IR array captures L×W×H in motion, ±2mm, irregular shapes included.",
  },
  {
    id: "WEIGH",
    icon: Scale,
    x: 900,
    body: "In-motion load cells capture true weight, ±5g, legal-for-trade optional.",
  },
];

const PARCEL_TRAVEL_MS = 5000;

export default function Anatomy() {
  const [litStation, setLitStation] = useState(0);

  // Demo parcel traverse: light each station as the parcel passes it.
  useEffect(() => {
    const t = window.setInterval(() => {
      const phase = (Date.now() % PARCEL_TRAVEL_MS) / PARCEL_TRAVEL_MS;
      setLitStation(Math.min(3, Math.floor(phase * 4)));
    }, 120);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>ANATOMY</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Four instruments, one tunnel.
        </h2>

        <div data-tour="bay-anatomy" className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* blueprint side-elevation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="blueprint-grid rounded-xl border border-line bg-surface p-4 md:p-6"
          >
            <svg viewBox="0 0 1040 380" className="h-auto w-full" role="img" aria-label="Scan tunnel side elevation blueprint">
              {/* conveyor line */}
              <motion.line
                x1="60" y1="300" x2="980" y2="300"
                className="stroke-linestrong" strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE }}
              />
              {/* rollers ticks */}
              {Array.from({ length: 24 }, (_, i) => (
                <motion.line
                  key={i}
                  x1={80 + i * 38} y1="300" x2={80 + i * 38} y2="312"
                  className="stroke-line" strokeWidth="1"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.03 }}
                />
              ))}
              {/* tunnel arch over X-RAY + DIMENSION */}
              <motion.path
                d="M 330 300 L 330 140 Q 330 110 360 110 L 700 110 Q 730 110 730 140 L 730 300"
                fill="none"
                className="stroke-data" strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1, ease: EASE }}
              />
              {/* dimension callout */}
              <motion.g
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.4 }}
              >
                <line x1="330" y1="70" x2="730" y2="70" className="stroke-ink2" strokeWidth="0.75" />
                <line x1="330" y1="64" x2="330" y2="76" className="stroke-ink2" strokeWidth="0.75" />
                <line x1="730" y1="64" x2="730" y2="76" className="stroke-ink2" strokeWidth="0.75" />
                <text x="530" y="62" textAnchor="middle" className="fill-ink2 font-mono" fontSize="10" letterSpacing="2">
                  TUNNEL 900 × 700 MM
                </text>
              </motion.g>
              {/* scan curtain inside tunnel */}
              <motion.line
                x1="530" y1="120" x2="530" y2="296"
                className="stroke-data" strokeWidth="2" strokeDasharray="6 5"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.8 }}
                viewport={{ once: true }}
                transition={{ delay: 1.1 }}
              />
              {/* station markers + leader lines */}
              {STATIONS.map((s, i) => (
                <motion.g
                  key={s.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 + i * 0.2 }}
                  className="group/st"
                >
                  <line
                    x1={s.x} y1="296" x2={s.x} y2="340"
                    className={cn("transition-colors", litStation === i ? "stroke-brand" : "stroke-line")}
                    strokeWidth="1"
                  />
                  <rect
                    x={s.x - 44} y="340" width="88" height="22" rx="4"
                    className={cn(
                      "transition-colors",
                      litStation === i ? "fill-brand-soft stroke-brand" : "fill-page stroke-line"
                    )}
                    strokeWidth="1"
                  />
                  <text
                    x={s.x} y="355" textAnchor="middle"
                    className={cn("font-mono transition-colors", litStation === i ? "fill-brand" : "fill-ink1")}
                    fontSize="10" letterSpacing="1.5"
                  >
                    {String(i + 1).padStart(2, "0")} {s.id}
                  </text>
                </motion.g>
              ))}
              {/* demo parcel traversing (translateX 5s loop) */}
              <motion.g
                animate={{ x: [60, 940] }}
                transition={{ duration: PARCEL_TRAVEL_MS / 1000, repeat: Infinity, ease: "linear" }}
              >
                <rect x="-14" y="272" width="28" height="26" rx="2" className="fill-brand/85" />
                <rect x="-14" y="272" width="28" height="26" rx="2" fill="none" className="stroke-onbrand/60" strokeWidth="1" />
              </motion.g>
            </svg>
          </motion.div>

          {/* station list */}
          <ol className="flex flex-col gap-4">
            {STATIONS.map((s, i) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: EASE }}
                className={cn(
                  "flex gap-4 rounded-xl border p-4 transition-colors duration-300",
                  litStation === i ? "border-brand/60 bg-brand-soft" : "border-line bg-surface"
                )}
              >
                <span className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300",
                  litStation === i ? "border-brand text-brand" : "border-line text-ink2"
                )}>
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink0">
                    {String(i + 1).padStart(2, "0")} · {s.id}
                  </h3>
                  <p className="mt-1 text-[13px] leading-[1.55] text-ink1">{s.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
