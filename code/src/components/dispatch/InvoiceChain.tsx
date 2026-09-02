import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";
import { ERPNEXT_DOCTYPES, INVOICE_CHAIN } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Section 5 — ERPNext document chain with travelling packets. */
export default function InvoiceChain() {
  return (
    <section data-tour="invoice-flow" className="bg-void py-[140px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker className="mb-4">DOCUMENT.CHAIN</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          <SplitWords text="From Delivery Note to IRN in one motion." />
        </h2>

        <div className="relative mt-12 overflow-x-auto rounded-xl border border-line bg-surface p-6 md:p-8">
          <div className="flex min-w-[880px] items-stretch gap-0">
            {INVOICE_CHAIN.map((node, i) => (
              <div key={node.id} className="flex flex-1 items-center">
                {/* node */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
                  whileHover={{ y: -4 }}
                  className="group relative w-full rounded-lg border border-line bg-raised p-4"
                  title={`ERPNext doctype: ${node.label}`}
                >
                  <span className="absolute left-0 top-0 h-[10px] w-[10px] border-l border-t border-brand" aria-hidden />
                  <span className="absolute bottom-0 right-0 h-[10px] w-[10px] border-b border-r border-brand" aria-hidden />
                  <div className="font-mono text-[10px] uppercase leading-4 tracking-[0.12em] text-ink0">
                    {node.label}
                  </div>
                  <div
                    className={cn(
                      "mt-3 inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
                      node.tone === "data" ? "border-data/40 text-data" : "border-brand/40 text-brand"
                    )}
                  >
                    {node.chip}
                  </div>
                </motion.div>
                {/* connector with travelling packet */}
                {i < INVOICE_CHAIN.length - 1 && (
                  <div className="relative mx-1 h-px w-10 shrink-0 md:w-14" aria-hidden>
                    <motion.span
                      className="absolute inset-0 bg-linestrong"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: EASE }}
                      style={{ transformOrigin: "left" }}
                    />
                    <motion.span
                      className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-[1px] bg-data"
                      animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i * 0.28 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          {ERPNEXT_DOCTYPES}
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1">
          ALL DOCUMENTS ARE REAL ERPNEXT DOCS — <span className="text-data">PORTAL & AUDIT TRAIL INCLUDED</span>
        </div>
      </div>
    </section>
  );
}
