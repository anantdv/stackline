import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";
import FleetHero from "@/components/fleet/FleetHero";
import LiveMapConsole from "@/components/fleet/LiveMapConsole";
import RouteCompare from "@/components/fleet/RouteCompare";
import RunBoard from "@/components/fleet/RunBoard";
import EtaDriver from "@/components/fleet/EtaDriver";
import Geofence from "@/components/fleet/Geofence";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Fleet() {
  return (
    <>
      {/* 1 — Hero with live FleetMap backdrop */}
      <FleetHero />
      {/* 2 — Live fleet map console */}
      <LiveMapConsole />
      {/* 3 — Route optimization before/after */}
      <RouteCompare />
      {/* 4 — Outward / inward / backhaul */}
      <RunBoard />
      {/* 5 — ETA & driver assignment */}
      <EtaDriver />
      {/* 6 — Geofences & alerts */}
      <Geofence />
      {/* 7 — CTA */}
      <section className="blueprint-grid relative overflow-hidden bg-void py-24 md:py-32">
        {/* final teal route line drawing across behind the H2 */}
        <svg
          aria-hidden
          viewBox="0 0 900 40"
          className="pointer-events-none absolute left-1/2 top-1/2 w-[min(90vw,900px)] -translate-x-1/2 -translate-y-1/2 opacity-40"
        >
          <motion.path
            d="M 0 30 C 180 30 240 8 450 12 S 700 34 900 18"
            fill="none"
            className="stroke-data"
            strokeWidth="1.5"
            strokeDasharray="6 5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: EASE }}
          />
        </svg>
        <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 text-center">
          <SectionKicker className="justify-center">STORY.COMPLETE</SectionKicker>
          <h2 className="mt-6 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
            <SplitWords text="From gate pass to proof of delivery — one line on a map." />
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-18% 0px" }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
            <GhostButton to="/network">Back to the network →</GhostButton>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2"
          >
            WORKS WITH ANY GPS TELEMATICS · DRIVER APP OPTIONAL · API-FIRST
          </motion.p>
        </div>
      </section>
    </>
  );
}
