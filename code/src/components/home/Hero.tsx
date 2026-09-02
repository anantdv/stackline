import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars } from "@/components/SplitText";
import { PrimaryButton } from "@/components/Buttons";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function HeroFallback() {
  return (
    <div className="h-full w-full bg-[radial-gradient(ellipse_at_70%_40%,#151b23_0%,#07090C_65%)] blueprint-grid" />
  );
}

export default function Hero() {
  return (
    <section data-tour="hero" className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-void">
      {/* 3D twin canvas — right-weighted, full height */}
      <div className="absolute inset-0 md:left-[22%]">
        <Suspense fallback={<HeroFallback />}>
          <HeroScene />
        </Suspense>
      </div>

      {/* Left-to-transparent scrim for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,12,0.92)_0%,rgba(7,9,12,0.65)_35%,transparent_62%)]"
      />

      {/* Content column */}
      <div className="relative z-10 flex min-h-[calc(100svh-72px)] flex-col justify-center px-6 py-24 md:pl-[8vw] md:pr-6">
        <div className="max-w-[560px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
          >
            <SectionKicker>VISUAL.WAREHOUSE.OS</SectionKicker>
          </motion.div>

          <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[72px] xl:text-[88px] xl:leading-[0.98]">
            <SplitChars
              delay={0.5}
              segments={[
                { text: "See " },
                { text: "every bin", accent: true },
                { text: ". Move " },
                { text: "every box", accent: true },
                { text: "." },
              ]}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6, ease: EASE }}
            className="mt-6 max-w-[480px] text-base leading-[1.65] text-ink1 md:text-lg"
          >
            Stackline turns your existing warehouse into a live 3D digital twin
            — racks, aisles, levels and bins — natively synced with ERPNext.
            Visual stock movement, bin capacity math, auto-allocation and
            workflows, in one spatial interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.22, duration: 0.6, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
            <a
              href="#twin"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Explore the 3D twin →
            </a>
          </motion.div>
        </div>

        {/* Bottom-left mono strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="pointer-events-none absolute bottom-8 left-6 hidden font-mono text-[11px] tracking-[0.14em] text-ink2 md:left-[8vw] md:block"
        >
          ISO VIEW · 48 RACKS · 1,152 BINS ·{" "}
          <span className="text-data">
            SYNC 12<span className="animate-caret-blink">MS</span>
          </span>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-ink2">
            SCROLL
          </span>
          <span className="h-10 w-px bg-linestrong animate-scroll-cue" />
        </motion.div>
      </div>
    </section>
  );
}
