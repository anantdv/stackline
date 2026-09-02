import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Upload } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";
import PortalChrome from "@/components/portal/PortalChrome";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const SWATCHES = [
  { name: "SAFETY ORANGE", value: "#f97316" },
  { name: "TEAL", value: "#14b8a6" },
  { name: "INDIGO", value: "#6366f1" },
  { name: "CRIMSON", value: "#e11d48" },
  { name: "AMBER", value: "#d97706" },
  { name: "EMERALD", value: "#059669" },
];

const TOGGLES = [
  { key: "stockValue", label: "SHOW STOCK VALUE" },
  { key: "orderRaising", label: "ALLOW ORDER RAISING" },
  { key: "asnApproval", label: "REQUIRE ASN APPROVAL" },
  { key: "watermark", label: "WATERMARK 'POWERED BY STACKLINE'" },
] as const;

type ToggleKey = (typeof TOGGLES)[number]["key"];

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-lg border border-line bg-page/60 px-3 py-2.5 transition-colors duration-200 hover:border-linestrong"
    >
      <span className="font-mono text-[10px] tracking-[0.14em] text-ink1">{label}</span>
      <span
        className={cn(
          "relative rounded-full border transition-colors duration-300",
          on ? "border-data bg-data-soft" : "border-linestrong bg-raised"
        )}
        style={{ height: 18, width: 32 }}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full",
            on ? "right-[3px] bg-data" : "left-[3px] bg-ink2"
          )}
        />
      </span>
    </button>
  );
}

/** Mini dashboard replica that re-skins live from --pa + toggle state. */
function Preview({
  color,
  letter,
  domain,
  toggles,
}: {
  color: string;
  letter: string;
  domain: string;
  toggles: Record<ToggleKey, boolean>;
}) {
  return (
    <div style={{ transition: "all 0.3s ease" }}>
      <PortalChrome
        brand={{ code: letter + letter, name: domain.split(".")[0]?.toUpperCase() ?? "YOUR3PL", color, url: domain }}
        brandVars={{ "--pa": color } as CSSProperties}
        watermark={toggles.watermark}
        compact
      >
        <div className="flex flex-col gap-3">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: "SKUS", v: "1,842", show: true },
              { k: "ACCURACY", v: "98.7%", show: true },
              { k: "VALUE", v: "₹86.4L", show: toggles.stockValue },
            ].map((s) => (
              <AnimatePresence key={s.k} mode="popLayout">
                {s.show && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden rounded-md border border-line bg-page/60 px-2 py-2"
                  >
                    <div className="font-display text-base font-semibold font-tnum" style={{ color, transition: "color 0.3s ease" }}>
                      {s.v}
                    </div>
                    <div className="font-mono text-[8px] tracking-[0.14em] text-ink2">{s.k}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>
          {/* funnel */}
          <div className="flex flex-col gap-1.5">
            {[46, 31, 18, 12].map((n, i) => (
              <div key={i} className="h-2.5 overflow-hidden rounded-sm bg-raised">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${(n / 46) * 100}%`,
                    background: i % 2 === 0 ? color : "var(--data)",
                    transition: "background 0.3s ease",
                  }}
                />
              </div>
            ))}
          </div>
          {/* actions */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {toggles.orderRaising && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="rounded-md px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-white"
                  style={{ background: color, transition: "background 0.3s ease" }}
                >
                  RAISE ORDER
                </motion.span>
              )}
            </AnimatePresence>
            {toggles.asnApproval && (
              <span className="rounded-md border border-warn/50 bg-warn/10 px-2 py-1 font-mono text-[8px] tracking-[0.12em] text-warn">
                ASN APPROVAL ON
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-ink2">
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white"
              style={{ background: color, transition: "background 0.3s ease" }}
            >
              {letter}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.14em]">
              Logo glyph swaps with the tenant
            </span>
          </div>
        </div>
      </PortalChrome>
    </div>
  );
}

export default function BrandingEngine() {
  const [color, setColor] = useState(SWATCHES[0]!.value);
  const [domain, setDomain] = useState("portal.your3pl.com");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    stockValue: true,
    orderRaising: true,
    asnApproval: false,
    watermark: true,
  });

  return (
    <section data-tour="portal-branding" className="bg-page px-6 py-24 md:py-36">
      <div className="mx-auto grid max-w-[1280px] items-start gap-12 lg:grid-cols-2">
        {/* controls */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>YOUR.BRAND</SectionKicker>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
            <SplitWords text="Your portal, your livery." />
          </h2>
          <p className="mt-4 max-w-[440px] text-base leading-[1.65] text-ink1">
            Every tenant gets their own accent, domain and feature switches.
            Change anything here — the preview re-skins live through the same
            CSS token system that powers the whole site.
          </p>
          <BlueprintCard className="mt-8 flex flex-col gap-4 p-5">
            {/* logo placeholder */}
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-linestrong bg-page/60 px-4 py-3">
              <Upload className="h-4 w-4 text-ink2" />
              <span className="font-mono text-[10px] tracking-[0.12em] text-ink2">
                CUSTOMER LOGO · PNG/SVG · AUTO-GLYPH FALLBACK
              </span>
            </div>
            {/* accent swatches */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                Accent
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SWATCHES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    title={s.name}
                    aria-label={`Accent ${s.name}`}
                    aria-pressed={color === s.value}
                    onClick={() => setColor(s.value)}
                    className={cn(
                      "h-8 w-8 rounded-lg border-2 transition-all duration-200",
                      color === s.value ? "scale-110 border-ink0" : "border-transparent hover:scale-105"
                    )}
                    style={{ background: s.value }}
                  />
                ))}
              </div>
            </div>
            {/* domain */}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                Portal domain
              </span>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-xs tracking-[0.08em] text-ink0 outline-none focus:border-brand"
                placeholder="portal.your3pl.com"
              />
            </div>
            {/* toggles */}
            <div className="flex flex-col gap-2">
              {TOGGLES.map((t) => (
                <Toggle
                  key={t.key}
                  label={t.label}
                  on={toggles[t.key]}
                  onChange={() => setToggles((prev) => ({ ...prev, [t.key]: !prev[t.key] }))}
                />
              ))}
            </div>
          </BlueprintCard>
        </motion.div>

        {/* live preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="lg:sticky lg:top-24"
        >
          <Preview
            color={color}
            letter={domain.replace("portal.", "").slice(0, 1).toUpperCase() || "Y"}
            domain={domain || "portal.your3pl.com"}
            toggles={toggles}
          />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
            Live re-skin · CSS variable <span className="text-data">--pa</span> threads through KPIs, funnel and buttons
          </p>
        </motion.div>
      </div>
    </section>
  );
}
