import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";
import ScanningHero from "@/components/scanning/ScanningHero";
import Anatomy from "@/components/scanning/Anatomy";
import ScanConsole from "@/components/scanning/ScanConsole";
import VolumetricMath from "@/components/scanning/VolumetricMath";
import FlagRules from "@/components/scanning/FlagRules";
import Downstream from "@/components/scanning/Downstream";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ScanningBay() {
  return (
    <>
      {/* 1 — Hero with ScanTunnel backdrop */}
      <ScanningHero />
      {/* 2 — Anatomy of the bay */}
      <Anatomy />
      {/* 3 — Live scan console */}
      <ScanConsole />
      {/* 4 — Volumetric math */}
      <VolumetricMath />
      {/* 5 — Flagging rules */}
      <FlagRules />
      {/* 6 — Throughput & downstream */}
      <Downstream />
      {/* 7 — CTA */}
      <section className="blueprint-grid relative overflow-hidden bg-void py-24 md:py-32">
        {/* one scanline sweep crossing the H2 on entry */}
        <motion.div
          aria-hidden
          initial={{ x: "-110%" }}
          whileInView={{ x: "110%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "linear", delay: 0.4 }}
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--data-soft), transparent)",
          }}
        />
        <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 text-center">
          <SectionKicker className="justify-center">NEXT.LEG</SectionKicker>
          <h2 className="mt-6 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
            <SplitWords text="Stop shipping air. Stop trusting labels." />
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-18% 0px" }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
            <GhostButton to="/transport">Next: load planning →</GhostButton>
          </motion.div>
        </div>
      </section>
    </>
  );
}
