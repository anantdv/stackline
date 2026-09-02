import type { Tour } from "./tours";

/**
 * Tours for the Network & Valuation pages (guide.md §5 authoring contract).
 * Merged into the main TOURS registry by the integrator — do not edit
 * tours.ts here.
 */
export const NETWORK_TOURS: Record<string, Tour> = {
  "/network": {
    id: "network",
    route: "/network",
    label: "Network Topology",
    estSeconds: 60,
    steps: [
      {
        target: '[data-tour="location-map"]',
        fallback: "main section:nth-of-type(2)",
        step: 1,
        title: "Click a live location",
        body: "Every pin is a real operation — warehouses, bins and stock value load on the right. Teal arcs are inter-location transfer lanes.",
        placement: "right",
        tryIt: "Click the DEL-NCR pin to select it.",
      },
      {
        target: '[data-tour="warehouse-chips"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Jump into a warehouse",
        body: "These chips list the warehouses at the selected location. Clicking one scrolls you into the drill-down and preselects it.",
        placement: "left",
      },
      {
        target: '[data-tour="warehouse-tabs"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Compare zoning patterns",
        body: "Switch tabs to see a single-category, velocity-split warehouse versus a multi-category one with per-zone rules like CCTV or 4°C.",
        placement: "bottom",
      },
      {
        target: '[data-tour="zoning-map"]',
        fallback: "main section:nth-of-type(3)",
        step: 4,
        title: "Hover a zone",
        body: "The floor plan is live: hovering a zone shows bins, utilization, SKUs and ERP-priced value. The rack strip below opens racks in the 3D twin.",
        placement: "top",
      },
      {
        target: '[data-tour="transfer-board"]',
        fallback: "main section:nth-of-type(6)",
        step: 5,
        title: "Watch stock in motion",
        body: "Active transfer lanes animate cartons between warehouses; the table below posts every move as an ERPNext Stock Transfer.",
        placement: "top",
      },
      {
        target: '[data-tour="rollup-table"]',
        fallback: "main section:nth-of-type(7)",
        step: 6,
        title: "Roll up the network",
        body: "One tree-table from location to zone with utilization bars and 30-day trends. Expand rows to drill without leaving the table.",
        placement: "top",
      },
    ],
  },

  "/valuation": {
    id: "valuation",
    route: "/valuation",
    label: "Asset Valuation",
    estSeconds: 75,
    steps: [
      {
        target: '[data-tour="scope-control"]',
        fallback: "main section:nth-of-type(2)",
        step: 1,
        title: "Choose your scope",
        body: "Rack, cluster, warehouse or the whole network — then slice item-wise, group-wise or variant-wise. Every chart below re-layouts instantly.",
        placement: "bottom",
      },
      {
        target: '[data-tour="treemap"]',
        fallback: "main section:nth-of-type(3)",
        step: 2,
        title: "Drill into the treemap",
        body: "Area is stock value; color is aging from teal (fresh) to red (dead). Click a block to zoom in and use the breadcrumb to climb back out.",
        placement: "top",
        tryIt: "Click a treemap block to zoom one level.",
      },
      {
        target: '[data-tour="lenses"]',
        fallback: "main section:nth-of-type(4)",
        step: 3,
        title: "Switch the lens",
        body: "Sunburst for hierarchy, heatmap for physical rack density, Pareto for ABC classes, and a sortable grid for auditors.",
        placement: "top",
      },
      {
        target: '[data-tour="timeline"]',
        fallback: "main section:nth-of-type(5)",
        step: 4,
        title: "Follow value over time",
        body: "Receipts, dispatches and ERPNext price updates land as event flags on the value curve. Hover the diamond flag to see a repricing diff.",
        placement: "top",
      },
      {
        target: '[data-tour="aging"]',
        fallback: "main section:nth-of-type(6)",
        step: 5,
        title: "Spot dead stock",
        body: "Aging buckets show value locked by age; the table lists the worst offenders with a suggested action — transfer, markdown or bundle.",
        placement: "top",
      },
      {
        target: '[data-tour="export"]',
        fallback: "main section:last-of-type",
        step: 6,
        title: "Export for the audit",
        body: "The exact view — scope, breakdown, as-of date — exports as a Stock Ledger–aligned valuation report your CFO can reconcile.",
        placement: "left",
      },
    ],
  },
};
