/**
 * /dashboard — Global Visibility Dashboard (v3).
 *
 * The network-wide command center: sticky command bar, KPI command strip,
 * situation room (map + unified ops feed), Exception Center, cross-module
 * status mosaic, StepRail and closing band. Denser than the marketing pages;
 * the blueprint grid backdrop stays on for the whole page in both themes.
 * All data flows through useDashboardData (tRPC + full demo fallbacks).
 */
import { useState } from "react";
import { HeroStrip, CommandBar } from "@/components/dashboard/CommandBar";
import KpiStrip from "@/components/dashboard/KpiStrip";
import SituationRoom from "@/components/dashboard/SituationRoom";
import ExceptionCenter from "@/components/dashboard/ExceptionCenter";
import StatusMosaic from "@/components/dashboard/StatusMosaic";
import { ClosingBand, HowItFlows } from "@/components/dashboard/StorySections";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import type { DashWindow } from "@/components/dashboard/demo";

export default function Dashboard() {
  const [window, setWindow] = useState<DashWindow>("24h");
  const data = useDashboardData(window);

  return (
    <div className="blueprint-grid">
      {/* §1a — hero strip */}
      <HeroStrip />

      {/* §1b — sticky command bar */}
      <CommandBar
        window={window}
        onWindow={setWindow}
        live={data.live}
        onToggleLive={data.setLiveOverride}
        refreshing={data.refreshing}
        syncedAt={data.syncedAt}
        onRefresh={data.refresh}
        visible={data.visible}
      />

      {/* §2 — KPI command strip */}
      <KpiStrip data={data} window={window} />

      {/* §3 — situation room: map + ops feed */}
      <SituationRoom data={data} window={window} />

      {/* §4 — exception center */}
      <ExceptionCenter data={data} />

      {/* §5 — cross-module status mosaic */}
      <StatusMosaic data={data} />

      {/* §6 — how it flows */}
      <HowItFlows />

      {/* §7 — closing band */}
      <ClosingBand data={data} />
    </div>
  );
}
