import { motion } from "framer-motion";
import { Check } from "lucide-react";
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ROWS: { legacy: string; stackline: string }[] = [
  { legacy: "Stock move = 3 forms & a supervisor", stackline: "Drag the carton; Stock Entry posts itself" },
  { legacy: "Bin capacity = tribal knowledge", stackline: "Exact carton counts from real geometry" },
  { legacy: "Putaway = “find an empty shelf”", stackline: "Engine scores every bin in milliseconds" },
  { legacy: "New hire ramp = 3 weeks on the floor", stackline: "Follow the twin on day one" },
  { legacy: "Cycle counts = annual shutdown", stackline: "Rolling counts, 99.2% accuracy" },
  { legacy: "ERP sync = nightly CSV", stackline: "Real-time, document-level mirror" },
];

export default function BeforeAfter() {
  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="max-w-2xl">
          <SectionKicker>WHY.IT.MATTERS</SectionKicker>
          <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="The spreadsheet warehouse vs. the spatial one." />
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-12 overflow-hidden rounded-xl border border-line bg-surface"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="w-1/2 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">
                  Legacy WMS
                </TableHead>
                <TableHead className="px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-data">
                  Stackline
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((r, i) => (
                <motion.tr
                  key={r.legacy}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-4% 0px" }}
                  transition={{ delay: i * 0.07, duration: 0.5, ease: EASE }}
                  className="border-line transition-colors hover:bg-raised/40"
                >
                  <TableCell className="px-6 py-4 text-[15px] text-ink2">
                    {r.legacy}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[15px] text-ink0">
                    <span className="flex items-start gap-3">
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 + 0.15, type: "spring", stiffness: 400, damping: 18 }}
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-data-soft"
                      >
                        <Check className="h-3 w-3 text-data" />
                      </motion.span>
                      {r.stackline}
                    </span>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </section>
  );
}
