import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { PrimaryButton } from "@/components/Buttons";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function WarehouseCta() {
  return (
    <section className="relative overflow-hidden bg-void py-24 md:py-32">
      {/* Breathing radial teal glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(45,212,191,0.10) 0%, transparent 65%)",
        }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.92, 1.06, 0.92] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="absolute inset-0 blueprint-grid opacity-60" />

      <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center px-6 text-center">
        <SectionKicker className="justify-center">GET.STARTED</SectionKicker>
        <h2 className="mt-6 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
          <SplitWords text="Send a floor plan. Get a twin." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
          className="mt-5 max-w-[480px] text-base leading-[1.65] text-ink1 md:text-lg"
        >
          48-hour turnaround, synced to your ERPNext site.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ delay: 0.32, duration: 0.7, ease: EASE }}
          className="mt-9"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
        </motion.div>
      </div>
    </section>
  );
}
