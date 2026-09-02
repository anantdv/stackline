import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Apple, Factory, ShoppingCart, Snowflake, Store } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import MetricStat from "@/components/MetricStat";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Industry = {
  id: string;
  label: string;
  icon: typeof ShoppingCart;
  image: string;
  imageAlt: string;
  title: string;
  body: string;
  chips: string[];
  stat: { value: number; suffix?: string; decimals?: number; caption: string };
};

const INDUSTRIES: Industry[] = [
  {
    id: "ecommerce",
    label: "E-COMMERCE & 3PL",
    icon: ShoppingCart,
    image: "/industry-ecommerce.jpg",
    imageAlt: "E-commerce fulfillment center with high racks and conveyors",
    title: "Peak season is just Tuesday.",
    body: "High-velocity pick faces, carton-level tracking and wave picking. The twin rebalances fast-movers weekly and keeps multi-tenant 3PL stock segregated by client.",
    chips: ["PICK-FACE 400×300 BINS", "WAVE PICKING", "CLIENT SEGREGATION", "SAME-DAY CUTOFF"],
    stat: { value: 38, suffix: "%", caption: "more lines / hour" },
  },
  {
    id: "pharma",
    label: "PHARMA & COLD CHAIN",
    icon: Snowflake,
    image: "/industry-pharma.jpg",
    imageAlt: "Pharmaceutical cold-chain warehouse with stainless racks",
    title: "FEFO is not optional.",
    body: "Batch and expiry tracked per bin. The allocation engine enforces FEFO, quarantines excursions, and cold-zone bins carry temperature-qualified rules.",
    chips: ["FEFO ENFORCED", "BATCH LOCK", "2–8°C ZONES", "AUDIT-READY TRAIL"],
    stat: { value: 100, suffix: "%", caption: "batch traceability" },
  },
  {
    id: "manufacturing",
    label: "MANUFACTURING",
    icon: Factory,
    image: "/industry-manufacturing.jpg",
    imageAlt: "Manufacturing raw-material store with heavy pallet racks",
    title: "Raw material to line-side, tracked.",
    body: "Heavy pallet bins with load-rated capacity math, backflush staging zones, and kitting workflows that feed production orders from ERPNext Manufacturing.",
    chips: ["1,200 KG LEVELS", "LINE-SIDE STAGING", "KITTING FLOW", "BACKFLUSH SYNC"],
    stat: { value: 0, caption: "line stoppages from stockouts" },
  },
  {
    id: "retail",
    label: "RETAIL & DISTRIBUTION",
    icon: Store,
    image: "/industry-retail.jpg",
    imageAlt: "Retail distribution center with wide aisles",
    title: "Replenishment before the gap.",
    body: "Store-ready picking, cross-dock lanes and threshold-triggered replenishment from bulk to pick face — the twin flags a gap before the shelf does.",
    chips: ["CROSS-DOCK LANES", "MIN/MAX FACES", "STORE-READY CARTONS"],
    stat: { value: 27, suffix: "%", caption: "less safety stock" },
  },
  {
    id: "food",
    label: "FOOD & BEVERAGE",
    icon: Apple,
    image: "/industry-food.jpg",
    imageAlt: "Food and beverage warehouse with crates and scanners",
    title: "Expiry-aware, all the way down.",
    body: "Date-code rotation, allergen segregation zones and weight-variable items. Cycle counts run weekly on autopilot with variance approval gates.",
    chips: ["DATE-CODE FEFO", "ALLERGEN ZONES", "CATCH-WEIGHT", "WEEKLY AUTO-COUNT"],
    stat: { value: 99.2, suffix: "%", decimals: 1, caption: "count accuracy" },
  },
];

function IndustryPanel({ industry }: { industry: Industry }) {
  return (
    <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-10">
      {/* Image with Ken Burns + palette treatment */}
      <div className="relative overflow-hidden rounded-xl border border-line">
        <motion.img
          key={industry.id}
          src={industry.image}
          alt={industry.imageAlt}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 6, ease: "linear" }}
          className="aspect-[4/3] h-full w-full object-cover"
          style={{ filter: "saturate(0.85) contrast(1.05)" }}
          loading="lazy"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[rgba(255,107,26,0.10)] via-transparent to-transparent"
          aria-hidden
        />
        <span className="absolute bottom-3 left-3 rounded border border-line bg-void/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink1 backdrop-blur-sm">
          PRESET / {industry.label}
        </span>
      </div>

      {/* Copy */}
      <div className="flex flex-col justify-center">
        <h3 className="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-ink0 md:text-3xl">
          {industry.title}
        </h3>
        <p className="mt-4 text-[15px] leading-[1.65] text-ink1 md:text-base">
          {industry.body}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {industry.chips.map((chip, i) => (
            <motion.span
              key={chip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05, duration: 0.4, ease: EASE }}
              className="rounded border border-line bg-raised px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em] text-ink1"
            >
              {chip}
            </motion.span>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 border-t border-line pt-6"
        >
          <MetricStat
            value={industry.stat.value}
            suffix={industry.stat.suffix ?? ""}
            decimals={industry.stat.decimals ?? 0}
            caption={industry.stat.caption}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default function IndustryTabs() {
  const [activeId, setActiveId] = useState(INDUSTRIES[0].id);
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0];

  return (
    <section className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>INDUSTRY.PRESETS</SectionKicker>
        <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="Configured for your floor." />
        </h2>

        <div className="mt-14 grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Tab rail — vertical on desktop, horizontal scroll on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
            role="tablist"
            aria-label="Industries"
          >
            {INDUSTRIES.map((ind, i) => {
              const isActive = ind.id === activeId;
              return (
                <motion.button
                  key={ind.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(ind.id)}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-lg border border-transparent px-4 py-3.5 text-left transition-all duration-300 lg:border-l-2 lg:border-l-line lg:pl-5",
                    isActive
                      ? "bg-raised lg:border-l-brand"
                      : "text-ink2 hover:bg-raised/60 hover:text-ink1",
                  )}
                >
                  <ind.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-brand" : "text-ink2")} />
                  <span
                    className={cn(
                      "font-mono text-[11px] uppercase tracking-[0.14em]",
                      isActive ? "text-ink0" : "text-ink2",
                    )}
                  >
                    {ind.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
          >
            <BlueprintCard className="min-h-[560px] p-6 hover:-translate-y-0 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <IndustryPanel industry={active} />
                </motion.div>
              </AnimatePresence>
            </BlueprintCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
