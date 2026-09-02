import { motion } from "framer-motion";
import { GitPullRequest, ShieldCheck, Users } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CARDS = [
  {
    icon: ShieldCheck,
    title: "Tenant isolation",
    copy: "Customer users see only their items, orders and invoices — enforced at the query layer, audited per request.",
  },
  {
    icon: Users,
    title: "Role matrix",
    copy: "Viewer / Ops / Finance roles per customer; your operators keep the full twin.",
  },
  {
    icon: GitPullRequest,
    title: "Approvals",
    copy: "Optional approval gates on customer-raised orders and ASNs before they hit the floor.",
  },
];

export default function RolesSecurity() {
  return (
    <section className="bg-page px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <SectionKicker>ROLES.SECURITY</SectionKicker>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
            >
              <BlueprintCard className={cn("h-full p-6")}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised text-brand">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink0">{c.title}</h3>
                <p className="mt-2 text-sm leading-[1.6] text-ink1">{c.copy}</p>
              </BlueprintCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
