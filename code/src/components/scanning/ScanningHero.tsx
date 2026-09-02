import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton } from "@/components/Buttons";
import { SplitChars } from "@/components/SplitText";
import ScanTunnel from "@/components/scanning/ScanTunnel";
import { CONSOLE_PARCELS } from "@/components/scanning/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VERBS = ["X-ray it.", "Measure it.", "Weigh it."];

export default function ScanningHero() {
  const [passCount, setPassCount] = useState(1317);
  const [parcelIdx, setParcelIdx] = useState(0);
  const [flash, setFlash] = useState(false);

  const onParcelPass = useCallback(() => {
    setPassCount((c) => c + 1);
    setParcelIdx((i) => (i + 1) % CONSOLE_PARCELS.length);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 600);
  }, []);

  const parcel = CONSOLE_PARCELS[parcelIdx];

  return (
    <section data-tour="hero" className="relative overflow-hidden bg-void">
      {/* full-bleed tunnel scene */}
      <div className="absolute inset-0">
        <ScanTunnel className="absolute inset-0" onParcelPass={onParcelPass} />
        {/* theme scrim: readable left column */}
        <div aria-hidden className="absolute inset-0" style={{ background: "var(--scrim)" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-[1280px] flex-col justify-center px-6 py-24">
        <div className="max-w-[640px]">
          <SectionKicker>SCANNING.BAY</SectionKicker>
          <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[76px]">
            {VERBS.map((v, i) => (
              <VerbWord key={v} text={v} index={i} />
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
            className="mt-6 max-w-[500px] text-base leading-[1.65] text-ink1 md:text-lg"
          >
            One pass through the bay and Stackline knows a parcel's contents
            profile, exact dimensions and true weight. Volumetric billing
            becomes honest, mis-declarations get caught, and every downstream
            system — bins, load plans, invoices — gets real numbers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Instrument my bay</PrimaryButton>
            <button
              type="button"
              onClick={() =>
                document.getElementById("scan-console")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Watch a scan ↓
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink2"
          >
            <span>X-RAY · DWS (DIM-WEIGH-SCAN)</span>
            <span><span className="text-data">1,400</span> PARCELS/HR</span>
            <span>±2MM / ±5G</span>
          </motion.div>
        </div>

        {/* HUD readout, updates per parcel crossing the curtain */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
          className={cn(
            "pointer-events-none absolute bottom-8 right-6 hidden rounded-xl border bg-void/70 px-4 py-3 font-mono backdrop-blur transition-colors duration-300 md:block",
            flash ? "border-data/70" : "border-line"
          )}
        >
          <div className="text-[9px] uppercase tracking-[0.18em] text-ink2">
            SCAN TUNNEL · LIVE
          </div>
          <div className="mt-1.5 flex items-center gap-4 text-[11px] tracking-[0.1em]">
            <span className="text-data font-tnum">{parcel.parcelId}</span>
            <span className="text-ink1 font-tnum">
              {parcel.l}×{parcel.w}×{parcel.h} CM
            </span>
            <span className="text-ink1 font-tnum">{parcel.actualKg.toFixed(1)} KG</span>
            <span className="text-ink2 font-tnum">#{passCount.toLocaleString("en-IN")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Each hero verb lights orange in sequence on a 1.2s staggered loop. */
function VerbWord({ text, index }: { text: string; index: number }) {
  const [lit, setLit] = useState(index === 0);
  useEffect(() => {
    let onTimer = 0;
    let offTimer = 0;
    const cycle = () => {
      setLit(true);
      offTimer = window.setTimeout(() => setLit(false), 1200);
    };
    const start = window.setTimeout(() => {
      cycle();
      onTimer = window.setInterval(cycle, 3600);
    }, 1400 + index * 1200);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(offTimer);
      window.clearInterval(onTimer);
    };
  }, [index]);
  return (
    <span className={cn("transition-colors duration-500", lit && "text-brand")}>
      <SplitChars segments={[{ text }]} delay={0.15 + index * 0.12} />
      {index < VERBS.length - 1 && <span> </span>}
    </span>
  );
}
