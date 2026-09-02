import { motion } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";
import ErpPriceBadge from "./ErpPriceBadge";
import { DEMO_RACKS, DEMO_WAREHOUSES, type Breakdown, type Scope } from "./demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const SCOPES: Scope[] = ["NETWORK", "LOCATION", "WAREHOUSE", "CLUSTER", "RACK"];
const BREAKDOWNS: { key: Breakdown; label: string }[] = [
  { key: "byItem", label: "ITEM-WISE" },
  { key: "byGroup", label: "GROUP-WISE" },
  { key: "byVariant", label: "VARIANT-WISE" },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div className="flex flex-wrap gap-0.5 rounded-lg border border-line bg-raised/60 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "relative rounded-md px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition-colors",
            value === o.key ? "text-onbrand" : "text-ink1 hover:text-ink0"
          )}
        >
          {value === o.key && (
            <motion.span
              layoutId={`${id}-seg`}
              className="absolute inset-0 rounded-md bg-brand"
              transition={{ duration: 0.25, ease: EASE }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function ControlBar({
  scope,
  setScope,
  breakdown,
  setBreakdown,
  warehouse,
  setWarehouse,
  rack,
  setRack,
  method,
  setMethod,
  live,
  onToggleLive,
}: {
  scope: Scope;
  setScope: (s: Scope) => void;
  breakdown: Breakdown;
  setBreakdown: (b: Breakdown) => void;
  warehouse: string;
  setWarehouse: (w: string) => void;
  rack: string;
  setRack: (r: string) => void;
  method: "FIFO" | "MOVING AVERAGE";
  setMethod: (m: "FIFO" | "MOVING AVERAGE") => void;
  live: boolean;
  onToggleLive: (v: boolean) => void;
}) {
  const showWarehousePicker = scope === "WAREHOUSE" || scope === "CLUSTER" || scope === "RACK" || scope === "LOCATION";
  const showRackPicker = scope === "RACK";

  return (
    <div className="sticky top-[88px] z-40" data-tour="scope-control">
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <BlueprintCard className="p-4 backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div>
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">SCOPE</div>
              <Segmented
                id="scope"
                options={SCOPES.map((s) => ({ key: s, label: s }))}
                value={scope}
                onChange={setScope}
              />
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">BREAKDOWN</div>
              <Segmented id="breakdown" options={BREAKDOWNS} value={breakdown} onChange={setBreakdown} />
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">VALUATION METHOD</div>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "FIFO" | "MOVING AVERAGE")}
                className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[11px] tracking-[0.1em] text-ink0 outline-none focus:border-brand"
              >
                <option>FIFO</option>
                <option>MOVING AVERAGE</option>
              </select>
              <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-ink2">
                SOURCE: ERPNEXT STOCK SETTINGS
              </div>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">AS-OF</div>
              <input
                defaultValue="TODAY"
                className="w-24 rounded-lg border border-line bg-transparent px-3 py-2 font-mono text-[11px] tracking-[0.1em] text-ink1 outline-none transition-colors focus:border-brand focus:text-ink0"
              />
            </div>
            <div className="ml-auto self-end pb-1">
              <ErpPriceBadge live={live} onToggle={onToggleLive} />
            </div>
          </div>

          {/* second row: warehouse / rack pickers */}
          {showWarehousePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 flex flex-wrap items-center gap-2 overflow-hidden border-t border-line pt-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">WAREHOUSE</span>
              {DEMO_WAREHOUSES.map((w) => (
                <button
                  key={w}
                  onClick={() => setWarehouse(w)}
                  className={cn(
                    "rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors",
                    warehouse === w
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-ink1 hover:text-ink0"
                  )}
                >
                  {w} ▾
                </button>
              ))}
              {showRackPicker && (
                <>
                  <span className="ml-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">RACK</span>
                  {DEMO_RACKS.slice(0, 8).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRack(r)}
                      className={cn(
                        "rounded border px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors",
                        rack === r
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line text-ink1 hover:text-ink0"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </BlueprintCard>
      </motion.div>
    </div>
  );
}
