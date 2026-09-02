import { motion } from "framer-motion";
import { Lock, ScrollText, ServerCog, Users } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CARDS = [
  {
    icon: Users,
    title: "ROLE-BASED ACCESS",
    copy: "Native Frappe roles; pickers see their zone only.",
  },
  {
    icon: ScrollText,
    title: "FULL AUDIT TRAIL",
    copy: "Every move links user, timestamp, document ID.",
  },
  {
    icon: Lock,
    title: "ENCRYPTED CREDS",
    copy: "AES-256 at rest, TLS 1.3 in transit.",
  },
  {
    icon: ServerCog,
    title: "YOUR INFRA",
    copy: "Self-hosted: geometry and stock never leave your network.",
  },
];

export default function SecurityGrid() {
  return (
    <section className="bg-page py-20 md:py-36">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>SECURITY.GOVERNANCE</SectionKicker>
          <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Your ledger, your rules." />
          </h2>
          <p className="mt-5 max-w-[480px] text-base leading-[1.65] text-ink1 md:text-lg">
            Stackline never bypasses Frappe. Every action runs through your
            site's permissions, workflows and audit log — the twin is a client,
            not a backdoor.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: EASE }}
            >
              <BlueprintCard className="h-full p-5">
                <card.icon className="h-5 w-5 text-brand" />
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink0">
                  {card.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink1">{card.copy}</p>
              </BlueprintCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
