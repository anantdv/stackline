import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, MapPin, Warehouse } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import LocationMap from "./LocationMap";
import { inrCompact, num, type NetLocation } from "./demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function utilColor(u: number) {
  return u < 70 ? "var(--data)" : u < 90 ? "var(--warn)" : "var(--crit)";
}

/** Mini capacity donut for the selected location. */
function CapacityDonut({ util }: { util: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx={40} cy={40} r={r} fill="none" className="stroke-line" strokeWidth={8} />
        <motion.circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke={utilColor(util)}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - util / 100) }}
          transition={{ duration: 1.1, ease: EASE }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-ink0 font-tnum">
        {util}%
      </span>
    </div>
  );
}

export default function MapSection({
  locations,
  isLive,
  onWarehouseJump,
}: {
  locations: NetLocation[];
  isLive: boolean;
  onWarehouseJump: (locationCode: string, warehouseCode: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<number>(locations[0]?.id ?? 1);
  const selected =
    locations.find((l) => l.id === selectedId) ?? locations[0];

  const avgUtil = useMemo(() => {
    if (!selected || selected.warehouses.length === 0) return 0;
    return Math.round(
      selected.warehouses.reduce((s, w) => s + w.util, 0) /
        selected.warehouses.length
    );
  }, [selected]);

  const sameCat =
    selected?.warehouses.filter((w) => w.categoryMode === "single-category")
      .length ?? 0;
  const multiCat = (selected?.warehouses.length ?? 0) - sameCat;

  return (
    <section id="network-map" className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>GEOGRAPHY</SectionKicker>
        <h2 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
          <SplitWords text="Every pin is a live operation." />
        </h2>

        <div className="mt-14 grid gap-10 lg:grid-cols-[58fr_42fr]">
          {/* Interactive map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <BlueprintCard className="blueprint-grid overflow-hidden p-4" >
              <div
                className="aspect-[4/3] min-h-[420px] w-full md:min-h-[560px]"
                data-tour="location-map"
              >
                <LocationMap
                  locations={locations}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                />
              </div>
              <div className="flex items-center justify-between border-t border-line px-3 pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
                  STYLIZED GEOGRAPHY · DOTS-GRID · NOT TO SCALE
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]",
                    isLive ? "text-data" : "text-warn"
                  )}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                        isLive ? "bg-data" : "bg-warn"
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex h-1.5 w-1.5 rounded-full",
                        isLive ? "bg-data" : "bg-warn"
                      )}
                    />
                  </span>
                  {isLive ? "LIVE SYNC" : "DEMO DATA"}
                </span>
              </div>
            </BlueprintCard>
          </motion.div>

          {/* Location detail stack */}
          <div className="flex flex-col gap-5">
            {/* location switcher chips */}
            <div className="flex flex-wrap gap-2">
              {locations.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                    selected?.id === l.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-ink1 hover:border-linestrong hover:text-ink0"
                  )}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {l.code}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="flex flex-col gap-5"
                >
                  <BlueprintCard className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
                        LOCATION ▸ <span className="text-brand">{selected.code}</span>
                      </span>
                      <span className="rounded border border-line px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-ink2">
                        {selected.region}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold text-ink0">
                      {selected.name}
                    </h3>

                    <div className="mt-6 grid grid-cols-3 gap-4">
                      {[
                        { label: "WAREHOUSES", value: num(selected.totals.warehouses) },
                        { label: "BINS", value: num(selected.totals.bins) },
                        { label: "STOCK VALUE", value: inrCompact(selected.totals.valueInr) },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="font-display text-xl font-semibold text-ink0 font-tnum md:text-2xl">
                            {m.value}
                          </div>
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center gap-5 border-t border-line pt-5">
                      <CapacityDonut util={avgUtil} />
                      <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-ink2">
                        AVG UTILIZATION
                        <br />
                        {sameCat} SAME-CATEGORY · {multiCat} MULTI-CATEGORY
                      </div>
                    </div>
                  </BlueprintCard>

                  {/* warehouse chips */}
                  <div className="flex flex-col gap-2" data-tour="warehouse-chips">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
                      WAREHOUSES AT THIS LOCATION
                    </span>
                    {selected.warehouses.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => onWarehouseJump(selected.code, w.code)}
                        className="group flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-linestrong"
                      >
                        <span className="flex items-center gap-3">
                          <Warehouse className="h-4 w-4 text-brand" />
                          <span className="font-mono text-xs tracking-[0.08em] text-ink0">
                            {w.code}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                            {w.category}
                          </span>
                        </span>
                        <span className="flex items-center gap-3 font-mono text-[10px] text-ink2">
                          <Boxes className="h-3.5 w-3.5" />
                          {num(w.bins)} BINS · {inrCompact(w.valueInr)}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
