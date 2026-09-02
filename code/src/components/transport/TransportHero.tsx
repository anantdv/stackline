import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars } from "@/components/SplitText";
import { PrimaryButton } from "@/components/Buttons";
import LazyLoadPlanScene from "./LazyLoadPlanScene";
import { HERO_CARGO, HERO_VEHICLE } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const LOOP_SEC = 8;

export default function TransportHero() {
  const [runKey, setRunKey] = useState(1);
  // Container fills carton-by-carton, then re-runs on an 8s loop.
  useEffect(() => {
    const id = window.setInterval(() => setRunKey((k) => k + 1), LOOP_SEC * 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section data-tour="hero" className="relative flex min-h-[calc(100svh-64px)] items-center overflow-hidden bg-void">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-6 py-20 lg:grid-cols-[40%_60%]">
        <div className="relative z-10">
          <div className="absolute inset-y-0 -left-10 right-[-20%] z-[-1]" style={{ background: "var(--scrim)" }} aria-hidden />
          <SectionKicker className="mb-6">LOAD.PLANNER</SectionKicker>
          <h1 className="font-display text-[44px] font-bold leading-[1.02] tracking-tight text-ink0 sm:text-[58px] lg:text-[74px]">
            <SplitChars
              segments={[{ text: "Air", accent: true }, { text: " is the most expensive cargo." }]}
              stagger={0.02}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: EASE }}
            className="mt-6 max-w-[500px] text-lg leading-relaxed text-ink1"
          >
            Stackline builds the load before the truck arrives: cartons and pallets
            packed into trucks and containers in 3D, checked against weight, axle
            and stackability rules, sequenced to match the delivery route. Reserve
            vehicles as placeholders the moment orders drop.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Optimize my loads</PrimaryButton>
            <a
              href="#optimizer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Open the optimizer ↓
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15, duration: 0.6 }}
            className="mt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2"
          >
            CUBE UTILIZATION <span className="text-data">91%</span> · AXLE-LEGAL · ROUTE-SEQUENCED
          </motion.div>
        </div>

        {/* hero scene */}
        <div className="relative h-[380px] w-full md:h-[460px]">
          <LazyLoadPlanScene
            className="absolute inset-0"
            cargo={HERO_VEHICLE}
            items={HERO_CARGO}
            runKey={runKey}
            runSec={5}
            detail="hero"
            mode="solid"
          />
          <div className="pointer-events-none absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
            CONTAINER 40FT HC · FILL LOOP 8S · DRAG TO ORBIT
          </div>
        </div>
      </div>
    </section>
  );
}
