import type { Tour } from "./tours";

/**
 * Tour for the Global Visibility Dashboard (dashboard.md §8, guide.md §5
 * authoring contract). 6 steps, ~75s, 2 Try-it steps; step numbers mirror
 * the page's §6 StepRail. Merged into the main TOURS registry by the
 * integrator — do not edit tours.ts here.
 */
export const DASHBOARD_TOURS: Record<string, Tour> = {
  "/dashboard": {
    id: "tour-dashboard",
    route: "/dashboard",
    label: "Global Visibility Dashboard",
    estSeconds: 75,
    steps: [
      {
        target: '[data-tour="kpi-strip"]',
        fallback: "main section:nth-of-type(2)",
        step: 1,
        placement: "bottom",
        title: "Scan the six numbers",
        body: "Stock value, units, capacity, movements, vehicles and exceptions — the whole network in one glance. The red tile is the only one that wants to be zero.",
      },
      {
        target: '[data-tour="situation-map"]',
        fallback: "main section:nth-of-type(3)",
        step: 2,
        placement: "right",
        title: "Locate the trouble site",
        body: "Each location carries a health dot rolled up from its open exceptions. Click a pin to see its warehouses, then jump through to the full network map.",
      },
      {
        target: '[data-tour="ops-feed"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        placement: "left",
        tryIt: "Toggle the EWB filter chip and watch the log rebuild.",
        title: "Follow the live stream",
        body: "Every module reports here — putaways, gate-ins, GPS ticks, EWB changes, scan flags. TRY IT: toggle the EWB filter chip and watch the log rebuild.",
      },
      {
        target: '[data-tour="exception-center"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        placement: "top",
        tryIt: "Hit ACK on a warning row to clear it from the pulse loop.",
        title: "Triage what needs a human",
        body: "Expired e-way bills, blocked bins, dead stock, overdue trucks — ranked by severity and age. TRY IT: hit ACK on a warning row to clear it from the pulse loop.",
      },
      {
        target: '[data-tour="status-panels"]',
        fallback: "main section:nth-of-type(5)",
        step: 5,
        placement: "top",
        title: "Drill into any module",
        body: "Capacity heat, value treemap, fleet board, gate lanes, load rings. Each panel is a live window — the orange jump link opens the owning module in one click.",
      },
      {
        target: '[data-tour="command-bar"]',
        fallback: "main section:nth-of-type(1)",
        step: 6,
        placement: "bottom",
        title: "Set your watch",
        body: "Switch the 24h/7d/30d window, hit refresh to force a sync, and read the auto-refresh cadence ring. The dashboard keeps streaming while you work.",
      },
    ],
  },
};
