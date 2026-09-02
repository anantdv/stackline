/**
 * Dashboard §5 — Cross-Module Status Panels: asymmetric 12-col mosaic.
 * Row 1 (min-h 360): capacity heat grid 5 · valuation mini-treemap 4 · fleet
 * board 3. Row 2 (min-h 300): gate lanes 5 · load-plan rings 4 · module
 * chain strip 3. Every panel is a compressed read-only teaser with a jump
 * link into its owning module.
 */
import { motion } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import ErpPriceBadge from "@/components/valuation/ErpPriceBadge";
import { inrCompact } from "@/components/network/demo";
import PanelHeader from "./PanelHeader";
import CapacityHeatGrid from "./CapacityHeatGrid";
import MiniTreemap from "./MiniTreemap";
import FleetBoard from "./FleetBoard";
import ChainStrip from "./ChainStrip";
import { GateLanes, LoadPlanRings } from "./GateAndRings";
import type { DashboardData } from "./useDashboardData";
import type { ReactNode } from "react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function Panel({
  children,
  span,
  minH,
  delay,
  kicker,
  jumpTo,
  jumpLabel,
  headerRight,
  footer,
}: {
  children: ReactNode;
  span: string;
  minH: string;
  delay: number;
  kicker: string;
  jumpTo: string;
  jumpLabel: string;
  headerRight?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={span}
    >
      <BlueprintCard className={`flex h-full ${minH} flex-col overflow-hidden`}>
        <PanelHeader kicker={kicker} jumpTo={jumpTo} jumpLabel={jumpLabel} right={headerRight} />
        <div className="min-h-0 flex-1 p-4">{children}</div>
        {footer && (
          <div className="border-t border-line px-4 py-2.5 font-mono text-[10px] tracking-[0.12em] text-ink2">
            {footer}
          </div>
        )}
      </BlueprintCard>
    </motion.div>
  );
}

export default function StatusMosaic({ data }: { data: DashboardData }) {
  const enroute = data.vehicles.filter((v) => v.status === "ENROUTE").length;
  return (
    <section className="bg-void py-[72px]" data-tour="status-panels">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>MODULE.STATUS</SectionKicker>
        <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[40px]">
          <SplitWords text="Five modules. Five heartbeats." />
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          {/* 5a — capacity heat grid */}
          <Panel
            span="lg:col-span-5"
            minH="min-h-[360px]"
            delay={0}
            kicker="CAPACITY.HEAT"
            jumpTo="/network"
            jumpLabel="OPEN NETWORK"
            footer={<span>4 WAREHOUSES × 6 ZONES · DEL-02 CRIT 92% · CAPACITY SCALE &lt;70 TEAL / 70–89 WARN / ≥90 CRIT</span>}
          >
            <CapacityHeatGrid locations={data.locations} />
          </Panel>

          {/* 5b — valuation mini treemap (₹ panel → badge mandatory) */}
          <Panel
            span="lg:col-span-4"
            minH="min-h-[360px]"
            delay={0.08}
            kicker="VALUE.ROLLUP"
            jumpTo="/valuation"
            jumpLabel="OPEN VALUATION"
            headerRight={<ErpPriceBadge live={data.live} onToggle={data.setLiveOverride} size="sm" />}
            footer={
              <span>
                TOTAL {inrCompact(data.totalValueInr)} · DEAD STOCK {inrCompact(data.deadStockInr)} · SOURCE ERPNEXT FIFO
              </span>
            }
          >
            <MiniTreemap root={data.tree} />
          </Panel>

          {/* 5c — fleet board */}
          <Panel
            span="md:col-span-2 lg:col-span-3"
            minH="min-h-[360px]"
            delay={0.16}
            kicker="FLEET.LIVE"
            jumpTo="/fleet"
            jumpLabel="OPEN FLEET"
            headerRight={
              <span className="font-mono text-[10px] tracking-[0.12em] text-data font-tnum">
                {enroute} ENROUTE
              </span>
            }
          >
            <FleetBoard vehicles={data.vehicles} />
          </Panel>

          {/* 5d — gate lanes */}
          <Panel
            span="lg:col-span-5"
            minH="min-h-[300px]"
            delay={0}
            kicker="GATE.LANES"
            jumpTo="/gate"
            jumpLabel="OPEN GATE"
            footer={<span>14 MOVEMENTS TODAY · AVG TURNAROUND 42M</span>}
          >
            <GateLanes docks={data.docks} />
          </Panel>

          {/* 5e — load-plan rings (₹ panel → badge mandatory) */}
          <Panel
            span="lg:col-span-4"
            minH="min-h-[300px]"
            delay={0.08}
            kicker="LOAD.RINGS"
            jumpTo="/transport"
            jumpLabel="OPEN LOAD PLANNING"
            headerRight={<ErpPriceBadge live={data.live} onToggle={data.setLiveOverride} size="sm" />}
          >
            <LoadPlanRings plans={data.plans} />
          </Panel>

          {/* 5f — module chain strip */}
          <Panel
            span="lg:col-span-3"
            minH="min-h-[300px]"
            delay={0.16}
            kicker="CHAIN.HEALTH"
            jumpTo="/scanning-bay"
            jumpLabel="START OF CHAIN"
          >
            <ChainStrip chain={data.chain} />
          </Panel>
        </div>
      </div>
    </section>
  );
}
