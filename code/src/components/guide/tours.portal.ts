import type { Tour } from "@/components/guide/tours";

/**
 * v2 page tours for the 3PL portal and floor mobile app (guide.md §5
 * authoring contract). Kept in a separate module because `tours.ts` is owned
 * by the guide engine — the integrator merges PORTAL_TOURS into TOURS:
 *
 *   import { PORTAL_TOURS } from "./tours.portal";
 *   const TOURS = { ...BASE_TOURS, ...PORTAL_TOURS };
 */
export const PORTAL_TOURS: Record<string, Tour> = {
  "/3pl-portal": {
    id: "tour-3pl",
    route: "/3pl-portal",
    label: "3PL Customer Portal",
    estSeconds: 60,
    steps: [
      {
        target: '[data-tour="hero"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "See both sides",
        body: "Same ledger, two windows: your operators get the 3D twin, customers get a clean branded portal. Neither sees the other's view.",
        placement: "bottom",
      },
      {
        target: '[data-tour="portal-dashboard"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Explore the customer dashboard",
        body: "This is the tenant-isolated view: their SKUs, stock value, order funnel and live activity. Switch tenants with the chips above the card.",
        placement: "top",
      },
      {
        target: '[data-tour="portal-raise"]',
        fallback: "main section:nth-of-type(3)",
        step: 3,
        title: "Raise an ASN",
        body: "Customers create work themselves: pick an item, set qty, raise the ASN. Watch it validate and reserve bins in seconds.",
        tryIt: "Click “Raise ASN” to run the validation flow.",
        placement: "left",
      },
      {
        target: '[data-tour="portal-branding"]',
        fallback: "main section:nth-of-type(4)",
        step: 4,
        title: "Reskin the portal live",
        body: "Pick an accent color or flip a feature toggle — the preview re-skins instantly through CSS variables. Your livery, per tenant.",
        tryIt: "Click a color swatch to re-skin the preview.",
        placement: "top",
      },
      {
        target: '[data-tour="portal-sla"]',
        fallback: "main section:nth-of-type(5)",
        step: 5,
        title: "Check SLAs and billing",
        body: "Gauges show accuracy and turnaround against targets. Charges roll up into an invoice that posts straight to ERPNext.",
        placement: "top",
      },
    ],
  },

  "/mobile-app": {
    id: "tour-mobile",
    route: "/mobile-app",
    label: "Floor Mobile App",
    estSeconds: 60,
    steps: [
      {
        target: '[data-tour="mobile-home"]',
        fallback: "main section:first-of-type",
        step: 1,
        title: "Pocket the twin",
        body: "The phone is live UI, not a screenshot. Move your cursor over it — the frame tilts; the home screen shows today's picks and putaways.",
        placement: "left",
      },
      {
        target: '[data-tour="mobile-scan"]',
        fallback: "main section:nth-of-type(2)",
        step: 2,
        title: "Scan with the camera",
        body: "No dedicated hardware: the phone camera locks 1D/2D barcodes and drops the result into the active task. Watch the scanline sweep.",
        placement: "top",
      },
      {
        target: '[data-tour="mobile-qr"]',
        fallback: "main section:nth-of-type(2)",
        step: 3,
        title: "Open a bin card",
        body: "Every printed QR bin label opens its live card — fill level, contents, and putaway/move/count actions on the spot.",
        placement: "top",
      },
      {
        target: '[data-tour="mobile-nfc"]',
        fallback: "main section:nth-of-type(2)",
        step: 4,
        title: "Tap NFC tags",
        body: "Gloves on? Tap-to-verify works on NFC-tagged pallets, totes and doors — no camera aim needed. The ripple confirms contact.",
        placement: "top",
      },
      {
        target: '[data-tour="mobile-offline"]',
        fallback: "main section:nth-of-type(4)",
        step: 5,
        title: "Work through dead zones",
        body: "Offline mode queues every scan locally, then reconciles in order when signal returns. Watch QUEUED flip to POSTED with zero conflicts.",
        placement: "left",
      },
    ],
  },
};
