import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EASE } from "@/components/pricing/shared";

export const PRICING_FAQS: { q: string; a: string }[] = [
  {
    q: "Do we need ERPNext already running?",
    a: "No. We deploy a managed ERPNext site with your twin, or connect to your existing v14/v15 instance — self-hosted or Frappe Cloud.",
  },
  {
    q: "How is a 'bin' counted?",
    a: "A bin is one addressable storage cell — a pallet position or shelf slot. Racks, aisles and zones are unlimited.",
  },
  {
    q: "What do we need to convert our warehouse?",
    a: "A floor plan (PDF/DWG/CSV or a sketch) and your rack profiles. Turnaround is 48 hours for a standard site.",
  },
  {
    q: "Does it work offline?",
    a: "Floor devices queue scans and moves; everything reconciles with ERPNext when connectivity returns, with conflict resolution.",
  },
  {
    q: "Can we keep our bin naming?",
    a: "Yes — the generator supports any convention (ZONE-AISLE-RACK-LEVEL by default) and bulk-imports existing labels.",
  },
  {
    q: "Is there a free trial?",
    a: "The Pilot tier includes a 30-day twin proof-of-concept on your own floor plan.",
  },
];

export default function PricingFaq() {
  return (
    <section className="bg-void px-6 py-24 md:py-[140px]">
      <div className="mx-auto max-w-[800px]">
        <div className="flex flex-col items-start gap-4">
          <SectionKicker>QUESTIONS</SectionKicker>
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Asked before you did." />
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {PRICING_FAQS.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ delay: i * 0.07, duration: 0.6, ease: EASE }}
              className="mb-3 last:mb-0"
            >
              <AccordionItem
                value={`faq-${i}`}
                className="rounded-lg border border-line bg-surface px-6 transition-colors duration-300 data-[state=open]:border-brand"
              >
                <AccordionTrigger className="py-5 font-display text-base font-medium text-ink0 hover:no-underline [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg]:text-brand">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-ink1">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
