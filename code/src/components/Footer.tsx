import { Link } from "react-router";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";
import TelemetryTicker from "@/components/TelemetryTicker";

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Warehouse 3D", to: "/warehouse-3d" },
      { label: "Stock Movement", to: "/features" },
      { label: "Capacity Engine", to: "/features" },
      { label: "Auto-Allocation", to: "/features" },
      { label: "Workflow", to: "/workflow" },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Multi-Location", to: "/network" },
      { label: "Asset Valuation", to: "/valuation" },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Dispatch", to: "/dispatch" },
      { label: "Gate", to: "/gate" },
      { label: "Scanning Bay", to: "/scanning-bay" },
      { label: "Load Planning", to: "/transport" },
      { label: "Fleet", to: "/fleet" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Industries", to: "/industries" },
      { label: "Pricing", to: "/pricing" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "3PL Portal", to: "/3pl-portal" },
      { label: "Mobile App", to: "/mobile-app" },
      { label: "Contact", to: "/contact" },
      { label: "Docs", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/contact" },
      { label: "Terms", to: "/contact" },
      { label: "SLA", to: "/contact" },
    ],
  },
];

const V2_TICKER_ITEMS = [
  "EWB 2841-9912 ▸ VALID 22H 14M",
  "LOADPLAN TRK-07 ▸ 91% VOL",
  "GATE IN ▸ GJ-01-AB-4421",
  "BIN A-04-02-03 ▸ 82%",
  "X-RAY SCAN ▸ PARCEL #5581 CLEAR",
  "FLEET TRIP-0417 ▸ ETA 42 MIN",
  "TRANSFER WH-MUM-01 → WH-PUN-02 ▸ POSTED",
  "STOCK ENTRY STE-2025-0117 POSTED",
  "VALUATION ZONE-A ▸ ₹18.4L",
  "SYNC LATENCY ▸ 12MS",
  "NETWORK ₹18.42CR ▲ 2.4%",
  "6/8 VEHICLES ENROUTE ▪ EXCEPTIONS 4 ▪ DEL-02 92% CAPACITY",
];

const SOCIALS = [
  { icon: Github, label: "GitHub" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Twitter, label: "X" },
  { icon: Youtube, label: "YouTube" },
];

export default function Footer() {
  return (
    /* The footer is a deliberate dark "anchor" strip in BOTH themes (theme.md
       §2): data-theme="dark" re-asserts the dark token set inside it. */
    <footer
      data-theme="dark"
      className="relative overflow-hidden border-t border-linestrong bg-void"
    >
      <TelemetryTicker items={V2_TICKER_ITEMS} duration={36} />

      {/* Giant watermark wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center font-display text-[18vw] font-bold leading-[0.8] tracking-tight text-raised/60"
      >
        STACKLINE
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 pb-40 pt-20 md:pb-48">
        <div className="grid gap-12 md:grid-cols-3 lg:grid-cols-[1.2fr_repeat(5,1fr)]">
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Stackline" className="h-8 w-8" />
              <span className="font-display text-lg font-semibold tracking-[0.02em] text-ink0">
                STACKLINE
              </span>
            </Link>
            <p className="max-w-[240px] text-sm leading-relaxed text-ink1">
              See every bin. Move every box. The visual warehouse OS, natively
              synced with ERPNext.
            </p>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1">
              <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" />
              ERPNext Synced
            </span>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">
                {col.title}
              </span>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="text-sm text-ink1 transition-colors duration-200 hover:text-ink0"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <span className="font-mono text-[11px] tracking-[0.08em] text-ink2">
            © 2025 STACKLINE SYSTEMS
          </span>
          <span className="rounded border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-data">
            Made for ERPNext
          </span>
          <div className="flex items-center gap-4">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="text-ink2 transition-colors duration-200 hover:text-brand"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
