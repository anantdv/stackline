import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { PrimaryButton } from "@/components/Buttons";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Looping type-on of a portal search query (right half). */
function TypingSearch() {
  const QUERY = "SKU-0417 WIRELESS SCANNER";
  const [len, setLen] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      setLen((v) => (v >= QUERY.length + 8 ? 0 : v + 1));
    }, 140);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-surface/90 px-3 py-2">
      <span className="font-mono text-[10px] text-ink2">SEARCH ▸</span>
      <span className="font-mono text-[11px] tracking-[0.06em] text-ink0">
        {QUERY.slice(0, Math.min(len, QUERY.length))}
        <span className="animate-caret-blink text-brand">▌</span>
      </span>
    </div>
  );
}

/* Left half: operator twin slice — dark racks + ambient teal carton moves. */
function TwinSlice() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-line bg-void/80 p-3">
      <svg viewBox="0 0 320 200" className="h-full w-full">
        {/* rack rows */}
        {Array.from({ length: 4 }, (_, r) => (
          <g key={r}>
            <rect x={30} y={30 + r * 42} width={260} height={26} rx={2} fill="none" stroke="var(--line-strong)" strokeWidth={1} />
            {Array.from({ length: 6 }, (_, c) => (
              <rect
                key={c}
                x={40 + c * 42}
                y={36 + r * 42}
                width={30}
                height={14}
                fill="var(--bg-raised)"
                stroke="var(--line)"
              />
            ))}
          </g>
        ))}
        {/* teal path */}
        <path
          d="M40 22 H150 V88 H260 V172"
          fill="none"
          stroke="var(--data)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
          className="animate-[dash-flow_1.2s_linear_infinite]"
        />
      </svg>
      {/* ambient carton */}
      <span
        className="absolute left-[12%] top-[8%] h-3 w-3 rounded-[2px] bg-[#C8A27A] animate-[carton-arc_4.5s_ease-in-out_infinite]"
        aria-hidden
      />
      <span className="absolute bottom-2 left-3 font-mono text-[8px] uppercase tracking-[0.18em] text-ink2">
        OPERATOR VIEW · WH-MUM-01
      </span>
    </div>
  );
}

/* Right half: customer portal mock over the photo backdrop. */
function CustomerSlice() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-line">
      <img
        src="/portal-customer.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/40" aria-hidden />
      <div className="relative flex h-full flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-[#f97316] font-display text-[10px] font-bold text-white">A</span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink0">ACME RETAIL PVT</span>
          <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.16em] text-data">● SYNCED</span>
        </div>
        <TypingSearch />
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: "SKUS", v: "1,842" },
            { k: "ACCURACY", v: "98.7%" },
            { k: "VALUE", v: "₹86.4L" },
          ].map((s) => (
            <div key={s.k} className="rounded-md border border-line bg-surface/80 px-2 py-2">
              <div className="font-display text-sm font-semibold text-ink0 font-tnum">{s.v}</div>
              <div className="font-mono text-[8px] tracking-[0.14em] text-ink2">{s.k}</div>
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-md border border-data/40 bg-data-soft px-3 py-2">
          <span className="font-mono text-[9px] tracking-[0.1em] text-data">
            09:41 YOUR ORDER #SO-2841 PICKED · 8/8 LINES
          </span>
        </div>
        <span className="absolute bottom-2 right-3 font-mono text-[8px] uppercase tracking-[0.18em] text-ink2">
          CUSTOMER VIEW · TENANT ACME
        </span>
      </div>
    </div>
  );
}

export default function PortalHero() {
  return (
    <section
      data-tour="hero"
      className="relative flex min-h-[calc(100svh-72px)] flex-col justify-center overflow-hidden bg-void blueprint-grid"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-center gap-10 px-6 py-20 lg:grid-cols-2">
        {/* content column (over the left/operator half) */}
        <div>
          <SectionKicker>3PL.PORTAL</SectionKicker>
          <h1 className="mt-6 font-display text-[42px] font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[72px]">
            <SplitWords text="Give every customer their own window." stagger={0.06} />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
            className="mt-6 max-w-[460px] text-lg leading-[1.65] text-ink1"
          >
            Your customers log in, see only their stock, raise orders and ASNs,
            track SLAs and download invoices — branded as your operation. No
            calls asking &ldquo;where is my inventory?&rdquo;
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Offer the portal</PrimaryButton>
            <a
              href="#portal-customer-view"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px]",
                "font-display text-[15px] font-semibold text-ink0 transition-colors duration-300",
                "hover:border-brand hover:text-brand"
              )}
            >
              See a customer&rsquo;s view ↓
            </a>
          </motion.div>
        </div>

        {/* split-screen visual metaphor */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
            className="relative grid grid-cols-2 gap-4"
          >
            <div className="h-[340px] md:h-[420px]">
              <TwinSlice />
            </div>
            <div className="h-[340px] md:h-[420px]">
              <CustomerSlice />
            </div>
            {/* divider hairline, draws top→bottom */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
              style={{ transformOrigin: "top" }}
              className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-linestrong"
              aria-hidden
            />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-linestrong bg-void px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-ink1">
              SAME LEDGER · TWO WINDOWS
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
