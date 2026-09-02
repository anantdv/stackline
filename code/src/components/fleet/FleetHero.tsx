import { useMemo } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton } from "@/components/Buttons";
import { SplitChars } from "@/components/SplitText";
import FleetMap from "@/components/fleet/FleetMap";
import { useLiveVehicles, useRouteBoard } from "@/components/fleet/useFleetData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function FleetHero() {
  const { vehicles } = useLiveVehicles();
  const { routes } = useRouteBoard();
  const mapRoutes = useMemo(
    () => routes.map((r) => ({ stops: r.stops, direction: r.direction })),
    [routes]
  );
  const moving = vehicles.filter((v) => v.state === "moving").length;

  return (
    <section data-tour="hero" className="relative overflow-hidden bg-void">
      {/* full-bleed live map backdrop */}
      <div className="absolute inset-0">
        <FleetMap vehicles={vehicles} routes={mapRoutes} demo dim heartbeat />
        <div aria-hidden className="absolute inset-0" style={{ background: "var(--scrim)" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-void to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-[1280px] flex-col justify-center px-6 py-24">
        <div className="max-w-[620px]">
          <SectionKicker>FLEET.GPS</SectionKicker>
          <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[74px]">
            <SplitChars
              segments={[
                { text: "Your freight has a " },
                { text: "heartbeat", accent: true },
                { text: "." },
              ]}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
            className="mt-6 max-w-[500px] text-base leading-[1.65] text-ink1 md:text-lg"
          >
            GPS-connected vehicles, outward deliveries and inward pickups on one
            map. Stackline optimizes multi-stop routes, assigns drivers, ticks
            ETAs, and closes the loop with geofenced arrivals at your gates.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Connect my fleet</PrimaryButton>
            <button
              type="button"
              onClick={() =>
                document.getElementById("fleet-map")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Open the live map ↓
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink2"
          >
            <span><span className="text-data font-tnum">{moving}</span> VEHICLES LIVE</span>
            <span>38 STOPS TODAY</span>
            <span>ETA DRIFT <span className="text-data">±6 MIN</span></span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
