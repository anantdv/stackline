/**
 * GuideTour tour registry — Stackline's self-learning interface (guide.md).
 *
 * AUTHORING CONTRACT — to add a page tour:
 *   1. Add `data-tour="unique-key"` attributes to the key elements in your
 *      page (stable attribute selectors beat positional ones).
 *   2. Add an entry to TOURS below, keyed by the route path.
 *
 * Steps should be 4–7, ≤ 90s total, verb-first titles (≤ 6 words), bodies
 * ≤ 2 short sentences. Where the page has a StepRail "How it flows" section,
 * keep `step` numbers aligned with it. Max 2 `tryIt` (interactive) steps per
 * tour. Always provide a positional `fallback` selector (e.g.
 * "main section:nth-of-type(2)") so the tour survives page refactors.
 *
 * Page agents: register v2 page tours here via the same registry.
 */

export type TourStep = {
  /** Primary selector — prefer `[data-tour="key"]`. */
  target: string;
  /** Fallback selector used when the primary target is missing. */
  fallback?: string;
  /** Display number — matches the page's StepRail where applicable. */
  step?: number;
  /** ≤ 6 words, verb-first. */
  title: string;
  /** ≤ 2 sentences, plain language. */
  body: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  /** If set: interactive "Try it" step; Next unlocks after the user clicks the target. */
  tryIt?: string;
};

export type Tour = {
  id: string;
  route: string;
  label: string;
  estSeconds: number;
  steps: TourStep[];
};

/* ------------------------------------------------------------------ */
/* Tour registry                                                       */
/* ------------------------------------------------------------------ */

export const TOURS: Record<string, Tour> = {
  "/": {
    id: "home",
    route: "/",
    label: "The Living Twin",
    estSeconds: 60,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Meet the living twin",
        body: "This is your warehouse as a live 3D model — every rack, aisle and bin. Drag to orbit it; it is synced with ERPNext in real time.",
        placement: "bottom",
      },
      {
        target: '[data-tour="nav-platform"]',
        fallback: "header nav",
        step: 2,
        title: "Browse the platform",
        body: "Grouped menus organize the whole system: the 3D twin, the network view, and day-to-day operations. Hover a group to see what's inside.",
        placement: "bottom",
      },
      {
        target: '[data-tour="engines"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Four core engines",
        body: "Visual stock movement, bin capacity math, auto-allocation and workflows. Each card opens a deep-dive on how the engine works.",
        placement: "top",
      },
      {
        target: '[data-tour="ops-console"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        title: "Watch mission control",
        body: "A live feed of putaways, picks and sync events. Teal values are healthy; amber and red follow the same capacity scale everywhere on the site.",
        placement: "top",
      },
      {
        target: '[data-tour="nav-status"]',
        fallback: "header",
        step: 5,
        title: "Check sync at a glance",
        body: "This pill shows the live ERPNext connection state wherever you are. Green pulse means every stock move is posting to your ERP.",
        placement: "bottom",
      },
      {
        target: '[data-tour="nav-demo"]',
        fallback: "header",
        step: 6,
        title: "Book a walkthrough",
        body: "Ready to see your own floor as a twin? Book a demo and we convert one of your warehouses live on the call.",
        placement: "bottom",
      },
    ],
  },

  "/warehouse-3d": {
    id: "warehouse-3d",
    route: "/warehouse-3d",
    label: "Digital-Twin Converter",
    estSeconds: 60,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "From floor plan to twin",
        body: "This page converts an existing warehouse into a parametric 3D model. No rebuild, no sensors — your layout becomes software.",
      },
      {
        target: '[data-tour="viewer"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Orbit the twin",
        body: "The viewer is a real CAD-style scene: drag to orbit, scroll to zoom. Racks, levels and bins are all addressable objects.",
        tryIt: "Drag the 3D scene to orbit the warehouse.",
      },
      {
        target: '[data-tour="capacity"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Read bin capacity",
        body: "Every bin reports fill percentage on the teal-to-red capacity scale. Click a bin to see its dimensions, contents and ERPNext stock.",
      },
      {
        target: '[data-tour="import"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        title: "Import your layout",
        body: "Start from a floor-plan image, a CSV of racks, or an ERPNext warehouse export. The converter infers bins and coordinates automatically.",
      },
    ],
  },

  "/features": {
    id: "features",
    route: "/features",
    label: "The Four Engines",
    estSeconds: 55,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Four engines, one twin",
        body: "Everything Stackline does is one of four engines: move stock visually, compute capacity, auto-allocate cartons, run workflows.",
      },
      {
        target: '[data-tour="engine-movement"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Move stock visually",
        body: "Drag a carton from one bin to another and the move posts to ERPNext as a Stock Entry. What you see is literally the ledger.",
      },
      {
        target: '[data-tour="engine-capacity"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Trust the capacity math",
        body: "Bin fill is computed from real dimensions, not guesses. The same teal/amber/red scale drives heatmaps, bars and alerts.",
      },
      {
        target: '[data-tour="engine-allocation"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        title: "Let it allocate",
        body: "Incoming cartons are routed to the best bin automatically — by size, weight class, zone rules and pick frequency.",
      },
      {
        target: '[data-tour="engine-workflow"]',
        fallback: "main section:nth-of-type(5)",
        step: 5,
        title: "Automate the floor",
        body: "Workflows turn repeatable routines — cycle counts, replenishment, QC holds — into assigned, timed tasks with SLAs.",
      },
    ],
  },

  "/erpnext": {
    id: "erpnext",
    route: "/erpnext",
    label: "ERPNext Integration",
    estSeconds: 50,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Native, not bolted on",
        body: "Stackline syncs with ERPNext doctypes directly — Stock Entry, Bin, Item, Warehouse. No middleware, no CSV exports.",
      },
      {
        target: '[data-tour="sync-diagram"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Follow the sync loop",
        body: "A visual move in the twin becomes a Stock Entry; ERPNext documents flow back as twin updates. The loop closes in milliseconds.",
      },
      {
        target: '[data-tour="doctype-map"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Map every doctype",
        body: "Each 3D object corresponds to an ERPNext record. This table shows exactly which doctype powers which part of the twin.",
      },
      {
        target: '[data-tour="setup"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        title: "Connect in minutes",
        body: "Setup is an API key and a site URL. Follow the checklist here and your first warehouse syncs before the coffee cools.",
      },
    ],
  },

  "/workflow": {
    id: "workflow",
    route: "/workflow",
    label: "Workflow Builder",
    estSeconds: 55,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Draw your process",
        body: "Workflows are built as visual node graphs: trigger → checks → actions. If you can draw it on a whiteboard, you can run it here.",
      },
      {
        target: '[data-tour="builder"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Connect the nodes",
        body: "Each node is a real operation — count, hold, notify, escalate. Edges define the order work flows through the floor.",
        tryIt: "Click a node to inspect its configuration.",
      },
      {
        target: '[data-tour="templates"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Start from a template",
        body: "Cycle counts, putaway, replenishment and QC ship as ready templates. Clone one, tweak the thresholds, deploy to a zone.",
      },
      {
        target: '[data-tour="walkthrough"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        title: "Watch a run end-to-end",
        body: "The pinned walkthrough replays a real putaway workflow step by step, including the SLA timers that keep it honest.",
      },
    ],
  },

  "/industries": {
    id: "industries",
    route: "/industries",
    label: "Industry Presets",
    estSeconds: 45,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Tuned per industry",
        body: "E-commerce, pharma, manufacturing, retail and food each get presets: bin sizes, zone rules, workflows and compliance defaults.",
      },
      {
        target: '[data-tour="industry-grid"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Pick your preset",
        body: "Each card is a complete starting configuration with a real case study. Choose the closest match — everything stays editable.",
        tryIt: "Click an industry card to preview its configuration.",
      },
      {
        target: '[data-tour="case-study"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Steal the playbook",
        body: "Case studies show the exact rack layouts, allocation rules and workflows deployed — copy what works into your own twin.",
      },
    ],
  },

  "/pricing": {
    id: "pricing",
    route: "/pricing",
    label: "Pricing & Calculator",
    estSeconds: 45,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Pay per bin, not seat",
        body: "Pricing scales with the size of your twin — the number of managed bins — not headcount. Three tiers, no surprises.",
      },
      {
        target: '[data-tour="calculator"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Price your warehouse",
        body: "Drag the calculator to your rack and bin count. The price updates live, so you can size a deployment before talking to us.",
        tryIt: "Move the calculator slider to your bin count.",
      },
      {
        target: '[data-tour="tiers"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Compare the tiers",
        body: "The comparison table lists every engine per tier. Most single-warehouse teams start on the middle tier and grow into multi-site.",
      },
    ],
  },

  "/contact": {
    id: "contact",
    route: "/contact",
    label: "Book a Demo",
    estSeconds: 40,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Talk to the team",
        body: "This is the fastest path to a working twin: a 30-minute call where we convert one of your warehouses live.",
      },
      {
        target: '[data-tour="demo-form"]',
        fallback: "main form, main section:nth-of-type(2)",
        step: 2,
        title: "Request your demo",
        body: "Tell us your warehouse count and rough bin volume. The more detail you share, the more of your floor we can build on the call.",
        tryIt: "Click into the form and start typing your company name.",
      },
      {
        target: '[data-tour="contact-details"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Reach us directly",
        body: "Prefer email or a call? Direct contacts and office details live here, alongside answers to the questions everyone asks first.",
      },
    ],
  },
  "/admin": {
    id: "tour-admin",
    route: "/admin",
    label: "Access & Roles",
    estSeconds: 45,
    steps: [
      {
        target: '[data-tour="admin-header"]',
        fallback: "main h1",
        step: 1,
        title: "Meet the admin console",
        body: "This is where account access is governed. Every teammate signs in with Kimi; the app creator is Administrator by default.",
      },
      {
        target: '[data-tour="admin-stats"]',
        fallback: "main section:nth-of-type(1)",
        step: 2,
        title: "Read the access split",
        body: "Total accounts, administrators and users at a glance. Keep admins few — they control configuration and integrations.",
      },
      {
        target: '[data-tour="admin-table"]',
        fallback: "main table",
        step: 3,
        title: "Promote or demote roles",
        body: "Switch any account between User (floor operations) and Administrator (full control) from the role column. Changes apply on the next API call.",
        tryIt: "Open a role dropdown to see both roles.",
      },
      {
        target: '[data-tour="admin-policy"]',
        fallback: "main section:last-of-type",
        step: 4,
        title: "Know what each role can do",
        body: "The policy card summarizes it: admins run configuration and planning; users run scanning, movements and gate operations.",
      },
    ],
  },
  "/floor-app": {
    id: "tour-floor",
    route: "/floor-app",
    label: "Floor App Basics",
    estSeconds: 45,
    steps: [
      {
        target: '[data-tour="floor-tasks"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Work the task queue",
        body: "Open putaway, transfer and pick tasks land here in real time. Tap COMPLETE TASK when the physical move is done — it posts straight to the ledger.",
      },
      {
        target: '[data-tour="floor-scan"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Scan bins and cartons",
        body: "The Scan tab uses the device camera for QR and barcodes, with manual entry as backup. Offline? Operations queue and sync when you're back.",
        tryIt: "Tap the Scan tab in the bottom bar.",
      },
      {
        target: '[data-tour="floor-bins"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Look up any bin",
        body: "Enter a bin ID to see live contents and capacity — the same data the 3D twin shows on desktop.",
      },
    ],
  },
};

/* v2 page-group tour registries (merged into the master registry) */
import { NETWORK_TOURS } from "./tours.network";
import { DISPATCH_TOURS } from "./tours.dispatch";
import { OPS_TOURS } from "./tours.ops";
import { PORTAL_TOURS } from "./tours.portal";
import { DASHBOARD_TOURS } from "./tours.dashboard";

Object.assign(
  TOURS,
  NETWORK_TOURS,
  DISPATCH_TOURS,
  OPS_TOURS,
  PORTAL_TOURS,
  DASHBOARD_TOURS,
);

export function getTour(route: string): Tour | undefined {
  return TOURS[route];
}

/* ------------------------------------------------------------------ */
/* Progress persistence — localStorage("stackline-guides")             */
/* shape: { [route]: { completed: boolean, stepsSeen: number } }       */
/* ------------------------------------------------------------------ */

const PROGRESS_KEY = "stackline-guides";

export type GuideProgress = Record<
  string,
  { completed: boolean; stepsSeen: number }
>;

export function getGuideProgress(): GuideProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as GuideProgress) : {};
  } catch {
    return {};
  }
}

function writeProgress(p: GuideProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* private mode — non-fatal */
  }
  window.dispatchEvent(new CustomEvent("stackline:guides-updated"));
}

export function markStepsSeen(route: string, stepsSeen: number) {
  const p = getGuideProgress();
  const prev = p[route] ?? { completed: false, stepsSeen: 0 };
  p[route] = { ...prev, stepsSeen: Math.max(prev.stepsSeen, stepsSeen) };
  writeProgress(p);
}

export function markTourCompleted(route: string, steps: number) {
  const p = getGuideProgress();
  p[route] = { completed: true, stepsSeen: steps };
  writeProgress(p);
}

export function isTourCompleted(route: string): boolean {
  return getGuideProgress()[route]?.completed === true;
}

/* ------------------------------------------------------------------ */
/* Tiny event bus between GuideTrigger / GuideTour                     */
/* ------------------------------------------------------------------ */

export const GUIDE_START_EVENT = "stackline:start-tour";
export const GUIDE_STATE_EVENT = "stackline:tour-state";

export function startTour(route: string) {
  window.dispatchEvent(new CustomEvent(GUIDE_START_EVENT, { detail: route }));
}
