/**
 * Dashboard §3 — Situation Room band: compact situation map (left, 6/11) +
 * unified ops feed (right, 5/11), equal height, drill-through links into the
 * owning modules.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import PanelHeader from "./PanelHeader";
import SituationMap from "./SituationMap";
import OpsFeed from "./OpsFeed";
import type { DashWindow } from "./demo";
import type { DashboardData } from "./useDashboardData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function SituationRoom({
  data,
  window,
}: {
  data: DashboardData;
  window: DashWindow;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const whCount = data.locations.reduce((s, l) => s + l.warehouses.length, 0);
  const mapLink = selected ? `/network?loc=${selected}` : "/network";

  return (
    <section className="bg-void py-16">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-6 flex items-center justify-between">
          <SectionKicker>SITUATION.ROOM</SectionKicker>
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink2">
            ALL TIMES IST
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-11">
          {/* 3a — map card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="lg:col-span-6"
          >
            <BlueprintCard className="flex h-full min-h-[520px] flex-col overflow-hidden">
              <PanelHeader
                kicker="SITUATION.MAP"
                jumpTo={mapLink}
                jumpLabel="OPEN NETWORK"
                right={
                  selected && (
                    <span className="font-mono text-[10px] tracking-[0.12em] text-brand">
                      {selected} SELECTED
                    </span>
                  )
                }
              />
              <div className="min-h-0 flex-1 p-3" data-tour="situation-map">
                <SituationMap
                  locations={data.locations}
                  transfers={data.transfers}
                  vehicles={data.vehicles}
                  selected={selected}
                  onSelect={setSelected}
                  visible={data.visible}
                  className="h-full"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
                <div className="flex gap-5 font-mono text-[10px] tracking-[0.14em] text-ink2">
                  <span>
                    <span className="text-ink0 font-tnum">{whCount}</span> WAREHOUSES
                  </span>
                  <span>
                    <span className="text-ink0 font-tnum">{data.kpis.capacityUtil.toFixed(1)}%</span> NETWORK UTIL
                  </span>
                  <span>
                    <span className="text-ink0 font-tnum">{data.transfers.length}</span> LANES ACTIVE
                  </span>
                </div>
                <Link
                  to={mapLink}
                  className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink1 transition-colors hover:text-brand"
                >
                  OPEN FULL NETWORK TOPOLOGY
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </BlueprintCard>
          </motion.div>

          {/* 3b — ops feed card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="lg:col-span-5"
          >
            <BlueprintCard className="flex h-full min-h-[520px] flex-col overflow-hidden">
              <PanelHeader
                kicker="OPS.FEED"
                right={
                  <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-data">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-data opacity-60" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-data" />
                    </span>
                    LIVE
                  </span>
                }
              />
              <OpsFeed data={data} window={window} />
            </BlueprintCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
