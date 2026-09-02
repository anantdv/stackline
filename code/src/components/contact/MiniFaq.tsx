import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EASE } from "@/components/contact/shared";

const FAQS = [
  {
    q: "Do you support multiple warehouses?",
    a: "Yes — one Stackline instance mirrors unlimited sites, each with its own twin, users and workflows.",
  },
  {
    q: "Can we import our existing bin labels?",
    a: "Bulk CSV import plus label-sheet export — your naming convention is preserved end to end.",
  },
  {
    q: "Is there an on-prem option?",
    a: "Enterprise deploys fully self-hosted beside your Frappe bench; no external dependency.",
  },
  {
    q: "What hardware do pickers need?",
    a: "Any browser device: Android handhelds, Zebra terminals, tablets or wallboards. Native barcode/QR scanning.",
  },
];

export default function MiniFaq() {
  return (
    <section className="bg-void px-6 py-24 md:py-[120px]">
      <div className="mx-auto max-w-[760px]">
        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink0 md:text-[30px]">
          Quick answers.
        </h3>
        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ delay: i * 0.07, duration: 0.6, ease: EASE }}
              className="mb-3 last:mb-0"
            >
              <AccordionItem
                value={`mini-faq-${i}`}
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
