import type { Tour } from "@/components/guide/tours";

/**
 * Page tours for /dispatch and /transport (guide.md §5 authoring contract).
 * The lead/integrator merges DISPATCH_TOURS into the TOURS registry —
 * page agents must not edit tours.ts.
 */
export const DISPATCH_TOURS: Record<string, Tour> = {
  "/dispatch": {
    id: "dispatch",
    route: "/dispatch",
    label: "Dispatch & Compliance",
    estSeconds: 75,
    steps: [
      {
        target: '[data-tour="method-tabs"]',
        fallback: "main section:nth-of-type(2)",
        step: 1,
        title: "Choose how it ships",
        body: "Road, air, sea or rail. The required compliance documents change with the method — watch the checklist rebuild.",
        placement: "bottom",
      },
      {
        target: '[data-tour="pipeline"]',
        fallback: "main section:nth-of-type(3)",
        step: 2,
        title: "Walk the dispatch line",
        body: "Scroll through six stations from pick to gate out. Each station lights up as work completes and its documents attach.",
        placement: "right",
        tryIt: "Scroll to move the shipment along the track",
      },
      {
        target: '[data-tour="ewb-card"]',
        fallback: "main section:nth-of-type(4)",
        step: 3,
        title: "Meet the e-way bill",
        body: "Generated the moment the invoice posts. The validity timer counts down live — amber means extend or re-generate.",
        placement: "top",
      },
      {
        target: '[data-tour="invoice-flow"]',
        fallback: "main section:nth-of-type(5)",
        step: 4,
        title: "Trace the document chain",
        body: "Delivery Note becomes a Sales Invoice, gets its IRN and QR in one call, then every document auto-attaches to the shipment.",
        placement: "top",
      },
      {
        target: '[data-tour="gate-link"]',
        fallback: "main section:last-of-type",
        step: 5,
        title: "Hand it to the gate",
        body: "The gate pass bundles every document into one QR. Continue to Gate Management to watch a vehicle exit.",
        placement: "top",
      },
    ],
  },
  "/transport": {
    id: "transport",
    route: "/transport",
    label: "Load Planning",
    estSeconds: 80,
    steps: [
      {
        target: '[data-tour="vehicle-library"]',
        fallback: "main section:nth-of-type(2)",
        step: 1,
        title: "Reserve a vehicle placeholder",
        body: "Trucks and containers are bookable before the freight exists. Chips show who is reserved, free, planned or in maintenance.",
        placement: "bottom",
      },
      {
        target: '[data-tour="optimizer"]',
        fallback: "main section:nth-of-type(3)",
        step: 2,
        title: "Watch the load build",
        body: "The packer fills the vehicle floor-up, heavy-first. Drag the scene to orbit the cutaway as cartons fly in.",
        placement: "top",
      },
      {
        target: '[data-tour="optimize-btn"]',
        fallback: '[data-tour="optimizer"] button',
        step: 3,
        title: "Run the optimizer",
        body: "Click OPTIMIZE to pack the pending cargo and sweep the utilization rings. Leftovers split to the next vehicle automatically.",
        placement: "right",
        tryIt: "Click OPTIMIZE to start the packing run",
      },
      {
        target: '[data-tour="axle-view"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        title: "Check axle legality",
        body: "Volume is not enough — loads must balance across axles. Drag the pallet on the deck and watch the center of gravity move.",
        placement: "top",
      },
      {
        target: '[data-tour="load-sequence"]',
        fallback: "main section:nth-of-type(6)",
        step: 5,
        title: "Load LIFO by stop",
        body: "The load is sequenced to the delivery route: last stop loads first, first stop rides at the door. Then the plan hands off to dispatch.",
        placement: "top",
      },
    ],
  },
};
