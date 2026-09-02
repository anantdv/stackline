import { motion } from "framer-motion";
import { Check } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const BULLETS = [
  "Bidirectional real-time sync",
  "Doctype-level mapping (Warehouse → Bin → Stock Entry)",
  "WebSocket live updates",
  "Offline queue with conflict resolution",
];

const DOCTYPES = [
  "Warehouse",
  "Bin",
  "Item",
  "Stock Entry",
  "Pick List",
  "Delivery Note",
  "Stock Reconciliation",
];

function SyncDiagram() {
  return (
    <BlueprintCard className="p-6 md:p-8">
      {/* Nodes */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="rounded-lg border border-brand/50 bg-brand-soft px-3 py-4 text-center">
          <div className="font-display text-sm font-semibold text-brand">3D TWIN</div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-ink2">STACKLINE UI</div>
        </div>
        <div className="rounded-lg border border-linestrong bg-raised px-3 py-4 text-center">
          <div className="font-display text-sm font-semibold text-ink0">SYNC</div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-ink2">ENGINE</div>
        </div>
        <div className="rounded-lg border border-data/50 bg-data-soft px-3 py-4 text-center">
          <div className="font-display text-sm font-semibold text-data">ERPNEXT</div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-ink2">FRAPPE</div>
        </div>
      </div>

      {/* Packet lanes */}
      <div className="mt-4 space-y-2">
        {[0, 1].map((lane) => (
          <div key={lane} className="relative h-4">
            <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
            {lane === 0 ? (
              <span
                className="absolute top-1 h-2 w-2 rounded-[2px] bg-brand [animation:packet-right_1.6s_linear_infinite]"
                style={{ animationDelay: "0s" }}
              />
            ) : (
              <span
                className="absolute top-1 h-2 w-2 rounded-[2px] bg-data [animation:packet-left_1.6s_linear_infinite]"
                style={{ animationDelay: "0.3s" }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-center gap-3 font-mono text-[9px] tracking-[0.18em] text-ink2">
        <span>REST</span>·<span>WEBHOOKS</span>·<span>SOCKETIO</span>
      </div>

      {/* Doctype list */}
      <div className="mt-6 border-t border-line pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
          Mapped doctypes
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DOCTYPES.map((d) => (
            <span
              key={d}
              className="rounded border border-line bg-raised px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-ink1"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </BlueprintCard>
  );
}

export default function ErpnextBand() {
  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>ERPNEXT.NATIVE</SectionKicker>
          <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Not an integration. A mirror." />
          </h2>
          <p className="mt-5 max-w-[480px] text-base leading-[1.65] text-ink1 md:text-lg">
            Stackline speaks Frappe natively. Warehouses, bins, items and stock
            entries stay in perfect lock-step — every visual move is a posted
            document, every posted document moves the twin.
          </p>
          <ul className="mt-7 flex flex-col gap-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-ink1">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-data/40 bg-data-soft">
                  <Check className="h-3 w-3 text-data" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <GhostButton to="/erpnext">See the doctype map →</GhostButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40, y: 30 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SyncDiagram />
        </motion.div>
      </div>
    </section>
  );
}
