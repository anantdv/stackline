import { motion } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Direction = "both" | "erp-to-twin" | "twin-to-erp";

const ROWS: Array<{
  object: string;
  doctype: string;
  direction: Direction;
  trigger: string;
}> = [
  { object: "Rack / Zone", doctype: "Warehouse (nested)", direction: "both", trigger: "Created on twin generation" },
  { object: "Bin", doctype: "Warehouse (leaf) + Bin Volume fields", direction: "both", trigger: "Dimension sync" },
  { object: "Carton / Stock", doctype: "Stock Ledger Entry / Batch", direction: "erp-to-twin", trigger: "Live levels" },
  { object: "Visual move", doctype: "Stock Entry (Material Transfer)", direction: "twin-to-erp", trigger: "On drop" },
  { object: "Putaway task", doctype: "Pick List / ToDo", direction: "both", trigger: "Allocation engine" },
  { object: "Outbound", doctype: "Delivery Note + Packing Slip", direction: "twin-to-erp", trigger: "Pack workflow" },
  { object: "Count", doctype: "Stock Reconciliation", direction: "twin-to-erp", trigger: "Cycle-count workflow" },
  { object: "Reservation", doctype: "Stock Reservation Entry", direction: "both", trigger: "Sales order sync" },
];

function DirectionGlyph({ direction }: { direction: Direction }) {
  if (direction === "both") {
    return (
      <span className="bg-gradient-to-r from-brand to-data bg-clip-text font-mono text-base text-transparent transition-transform duration-300 group-hover/row:translate-x-[3px]">
        ⇄
      </span>
    );
  }
  const erpToTwin = direction === "erp-to-twin";
  return (
    <span
      className={cn(
        "font-mono text-base transition-transform duration-300 group-hover/row:translate-x-[3px]",
        erpToTwin ? "text-data" : "text-brand",
      )}
    >
      {erpToTwin ? "⇐" : "⇒"}
    </span>
  );
}

export default function DoctypeMap() {
  return (
    <section id="doctype-map" className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>DOCTYPE.MAP</SectionKicker>
        <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="Every object, a document." />
        </h2>
        <p className="mt-5 max-w-[560px] text-base leading-[1.65] text-ink1 md:text-lg">
          Nothing lives only in the twin. Each visual entity is backed by a
          native ERPNext doctype — posted, validated and permission-checked.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mt-12"
        >
          <BlueprintCard className="p-2 hover:-translate-y-0 md:p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  {["Twin object", "ERPNext doctype", "Direction", "Trigger"].map((h) => (
                    <TableHead
                      key={h}
                      className="px-4 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink2"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((row, i) => (
                  <motion.tr
                    key={row.object}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-8% 0px" }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}
                    className="group/row border-line transition-colors hover:bg-raised"
                  >
                    <TableCell className="px-4 py-4 font-display text-sm font-medium text-ink0">
                      {row.object}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-mono text-xs tracking-[0.04em] text-data">
                      {row.doctype}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <DirectionGlyph direction={row.direction} />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-ink1">
                      {row.trigger}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </BlueprintCard>
        </motion.div>

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
          <span className="flex items-center gap-2">
            <span className="text-brand">⇒</span> Twin → ERPNext
          </span>
          <span className="flex items-center gap-2">
            <span className="text-data">⇐</span> ERPNext → Twin
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-brand to-data bg-clip-text text-transparent">⇄</span> Bidirectional
          </span>
        </div>
      </div>
    </section>
  );
}
