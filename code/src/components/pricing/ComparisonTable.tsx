import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { SplitWords } from "@/components/SplitText";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EASE } from "@/components/pricing/shared";

type Cell = boolean | string;

const ROWS: { feature: string; pilot: Cell; scale: Cell; enterprise: Cell }[] = [
  { feature: "3D digital twin & viewer", pilot: true, scale: true, enterprise: true },
  { feature: "Visual stock movement", pilot: true, scale: true, enterprise: true },
  { feature: "Bin capacity calculator", pilot: true, scale: true, enterprise: true },
  { feature: "ERPNext real-time sync", pilot: true, scale: true, enterprise: true },
  { feature: "Auto-allocation engine", pilot: false, scale: true, enterprise: true },
  { feature: "Workflow studio", pilot: false, scale: true, enterprise: true },
  { feature: "Cycle count automation", pilot: false, scale: true, enterprise: true },
  { feature: "Self-hosted option", pilot: false, scale: false, enterprise: true },
  { feature: "SSO / SAML", pilot: false, scale: false, enterprise: true },
  { feature: "Support", pilot: "EMAIL", scale: "PRIORITY", enterprise: "DEDICATED" },
];

function ValueCell({ value, rowIndex }: { value: Cell; rowIndex: number }) {
  if (typeof value === "string") {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink1">{value}</span>
    );
  }
  if (value) {
    return (
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ delay: rowIndex * 0.05 + 0.1, type: "spring", stiffness: 500, damping: 22 }}
        className="inline-flex"
      >
        <Check className="h-4 w-4 text-data" strokeWidth={2.5} />
      </motion.span>
    );
  }
  return <Minus className="h-4 w-4 text-ink2" />;
}

export default function ComparisonTable() {
  return (
    <section className="bg-page px-6 py-24 md:py-[160px]">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-4">
          <SectionKicker>COMPARE</SectionKicker>
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Every plan, side by side." />
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mt-14"
        >
          <BlueprintCard className="overflow-hidden hover:-translate-y-0">
            <div className="max-h-[70vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-surface">
                  <TableRow className="border-line hover:bg-transparent">
                    <TableHead className="w-[40%] px-6 py-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink2">
                      Feature
                    </TableHead>
                    {["Pilot", "Scale", "Enterprise"].map((h) => (
                      <TableHead
                        key={h}
                        className={
                          h === "Scale"
                            ? "px-4 py-5 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-brand"
                            : "px-4 py-5 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink2"
                        }
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROWS.map((row, i) => (
                    <motion.tr
                      key={row.feature}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-8% 0px" }}
                      transition={{ delay: i * 0.05, duration: 0.5, ease: EASE }}
                      className="border-line transition-colors hover:bg-raised/50"
                    >
                      <TableCell className="px-6 py-4 text-sm text-ink0">{row.feature}</TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <ValueCell value={row.pilot} rowIndex={i} />
                      </TableCell>
                      <TableCell className="bg-brand-soft/40 px-4 py-4 text-center">
                        <ValueCell value={row.scale} rowIndex={i} />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <ValueCell value={row.enterprise} rowIndex={i} />
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </BlueprintCard>
        </motion.div>
      </div>
    </section>
  );
}
