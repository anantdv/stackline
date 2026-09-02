import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars } from "@/components/SplitText";
import { PrimaryButton } from "@/components/Buttons";

const HeroBayScene = lazy(
  () => import("@/components/warehouse/HeroBayScene")
);

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function HeroFallback() {
  return (
    <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_60%,#151b23_0%,#07090C_68%)] blueprint-grid" />
  );
}

export default function WarehouseHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [sceneMounted, setSceneMounted] = useState(true);

  // Unmount the WebGL scene once scrolled 150% past the hero
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setSceneMounted(entry.isIntersecting),
      { rootMargin: "50% 0px 50% 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[calc(100svh-72px)] flex-col overflow-hidden bg-void"
    >
      {/* Full-bleed assembly scene */}
      <div className="absolute inset-0">
        {sceneMounted ? (
          <Suspense fallback={<HeroFallback />}>
            <HeroBayScene />
          </Suspense>
        ) : (
          <HeroFallback />
        )}
      </div>

      {/* Legibility scrims */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_30%,rgba(7,9,12,0.72)_78%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(7,9,12,0.95)_0%,transparent_100%)]"
      />

      {/* Centered content stack */}
      <div className="relative z-10 flex min-h-[calc(100svh-72px)] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: EASE }}
        >
          <SectionKicker>DIGITAL.TWIN</SectionKicker>
        </motion.div>

        <h1 className="mt-6 max-w-[900px] font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[64px] xl:text-[76px] xl:leading-[0.99]">
          <SplitChars
            delay={0.45}
            stagger={0.028}
            segments={[
              { text: "Any warehouse. A " },
              { text: "living 3D twin", accent: true },
              { text: " in minutes." },
            ]}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.6, ease: EASE }}
          className="mt-6 max-w-[640px] text-base leading-[1.65] text-ink1 md:text-lg"
        >
          Import a floor plan — PDF, DWG, CSV, or a photo of a sketch — and
          Stackline generates every rack, aisle, level and bin as an
          addressable, ERPNext-synced 3D object.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.18, duration: 0.6, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Convert my warehouse</PrimaryButton>
          <a
            href="#viewer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
          >
            Try the viewer ↓
          </a>
        </motion.div>

        {/* Mono strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] tracking-[0.16em] text-ink2"
        >
          PDF · DWG · CSV · SKETCH{" "}
          <span className="text-brand">→</span> GLB TWIN ·{" "}
          <span className="text-data">&lt; 5 MIN</span>
        </motion.div>
      </div>
    </section>
  );
}
