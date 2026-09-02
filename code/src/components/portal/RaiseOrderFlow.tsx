import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, Search } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  { n: "01", name: "CREATE", copy: "Sales order or ASN (advance ship notice) from the portal — item search, qty, delivery window." },
  { n: "02", name: "VALIDATE", copy: "Stackline checks stock/space instantly: available-to-promise or expected bin allocation." },
  { n: "03", name: "CONFIRM", copy: "Customer gets a promise date; your floor gets a workflow — no email, no re-keying." },
  { n: "04", name: "TRACK", copy: "Order walks the dispatch pipeline visibly; ASN shows live receiving progress at the gate." },
];

const ITEMS = [
  { sku: "SKU-0417", name: "Wireless Scanner", uom: "PCS" },
  { sku: "SKU-1093", name: "Barcode Label Roll", uom: "BOX" },
  { sku: "SKU-2210", name: "Thermal Printer", uom: "PCS" },
];

type Phase = "idle" | "validating" | "accepted";

function MiniForm() {
  const [query, setQuery] = useState("WIRELESS SCANNER");
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(ITEMS[0]!);
  const [qty, setQty] = useState(48);
  const [wh, setWh] = useState("WH-MUM-01");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageTick, setStageTick] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const raise = () => {
    if (phase !== "idle") return;
    setPhase("validating");
    setStageTick(1);
    timers.current.push(
      window.setTimeout(() => {
        setPhase("accepted");
        setStageTick(2);
      }, 900),
      window.setTimeout(() => setStageTick(3), 1500),
      window.setTimeout(() => setStageTick(4), 2100)
    );
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPhase("idle");
    setStageTick(0);
  };

  const filtered = ITEMS.filter((i) =>
    (i.sku + " " + i.name).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {phase === "idle" ? (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              {/* item search */}
              <div className="relative">
                <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                  Item search
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 focus-within:border-brand">
                  <Search className="h-3.5 w-3.5 text-ink2" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => setOpen(false), 150)}
                    className="w-full bg-transparent font-mono text-xs tracking-[0.08em] text-ink0 outline-none placeholder:text-ink2"
                    placeholder="SEARCH SKU / NAME"
                  />
                </div>
                <AnimatePresence>
                  {open && filtered.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-linestrong bg-raised shadow-2xl"
                    >
                      {filtered.map((i) => (
                        <li key={i.sku}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setItem(i);
                              setQuery(i.name.toUpperCase());
                              setOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface"
                          >
                            <span className="font-mono text-[10px] text-brand">{i.sku}</span>
                            <span className="text-xs text-ink1">{i.name}</span>
                            <span className="ml-auto font-mono text-[9px] text-ink2">{i.uom}</span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* qty stepper + warehouse */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                    Quantity
                  </label>
                  <div className="mt-1.5 flex items-center justify-between rounded-lg border border-line bg-surface px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 12))}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink1 hover:border-brand hover:text-brand"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-sm font-semibold text-ink0 font-tnum">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 12)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink1 hover:border-brand hover:text-brand"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                    Warehouse
                  </label>
                  <select
                    value={wh}
                    onChange={(e) => setWh(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-xs tracking-[0.08em] text-ink0 outline-none focus:border-brand"
                  >
                    <option>WH-MUM-01</option>
                    <option>WH-MUM-02</option>
                  </select>
                </div>
              </div>

              {/* readout + submit */}
              <div className="flex items-center justify-between rounded-lg border border-line bg-page/60 px-3 py-2">
                <span className="font-mono text-[10px] tracking-[0.12em] text-ink2">
                  EXPECTED: <span className="text-data">FRI 14:00</span>
                </span>
                <span className="font-mono text-[10px] tracking-[0.12em] text-ink2">
                  {item.sku} × {qty}
                </span>
              </div>
              <button
                type="button"
                data-tour="portal-raise"
                onClick={raise}
                className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand px-6 py-[13px] font-display text-[15px] font-semibold text-onbrand transition-all duration-300 hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-500 group-hover/btn:left-[120%] group-hover/btn:opacity-100"
                />
                Raise ASN
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col gap-4"
          >
            {/* progress chip */}
            <div
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-lg border px-4 py-3",
                phase === "validating" ? "border-linestrong bg-raised" : "border-data/50 bg-data-soft"
              )}
            >
              {phase === "validating" && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-data/20 to-transparent"
                  animate={{ x: ["-100%", "320%"] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              )}
              {phase === "accepted" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-data text-void">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-warn" />
              )}
              <span className="font-mono text-[11px] tracking-[0.12em] text-ink0">
                ASN-2025-0117 ▸{" "}
                {phase === "validating" ? (
                  <span className="text-warn">VALIDATING…</span>
                ) : (
                  <span className="text-data">✓ ACCEPTED · 3 BINS RESERVED</span>
                )}
              </span>
            </div>

            {/* 4-stage timeline ticking through */}
            <div className="grid grid-cols-4 gap-2">
              {STEPS.map((s, i) => {
                const done = stageTick > i;
                return (
                  <div
                    key={s.n}
                    className={cn(
                      "rounded-md border px-2 py-2 text-center transition-colors duration-500",
                      done ? "border-data/50 bg-data-soft" : "border-line bg-page/60"
                    )}
                  >
                    <div className={cn("font-mono text-[9px]", done ? "text-data" : "text-ink2")}>{s.n}</div>
                    <div className={cn("font-mono text-[9px] tracking-[0.1em]", done ? "text-ink0" : "text-ink2")}>
                      {s.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {phase === "accepted" && stageTick >= 4 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                type="button"
                onClick={reset}
                className="self-start font-mono text-[10px] uppercase tracking-[0.14em] text-ink1 underline-offset-4 hover:text-brand hover:underline"
              >
                ↺ Raise another
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RaiseOrderFlow() {
  return (
    <section className="bg-void px-6 py-24 md:py-40">
      <div className="mx-auto grid max-w-[1280px] items-start gap-12 lg:grid-cols-[45%_55%]">
        {/* copy + step rail */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>SELF.SERVE</SectionKicker>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
            <SplitWords text="Customers raise work, not tickets." />
          </h2>
          <div className="mt-10 flex flex-col gap-0">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                className="relative flex gap-4 border-l border-line pb-8 pl-6 last:pb-0"
              >
                <span className="absolute -left-[7px] top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-brand bg-void" aria-hidden />
                <div>
                  <div className="font-mono text-[10px] tracking-[0.18em] text-brand">
                    {s.n} · {s.name}
                  </div>
                  <p className="mt-1.5 max-w-[400px] text-sm leading-[1.6] text-ink1">{s.copy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* interactive mini-form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <BlueprintCard className="p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                Portal · New advance ship notice
              </span>
              <span className="font-mono text-[9px] tracking-[0.14em] text-ink2">TENANT: ACME</span>
            </div>
            <MiniForm />
          </BlueprintCard>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
            No email. No re-keying. The ASN lands as a receiving workflow on your floor.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
