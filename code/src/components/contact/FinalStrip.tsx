import { motion } from "framer-motion";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { EASE } from "@/components/contact/shared";

const SOCIALS = [
  { icon: Github, label: "GitHub" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Twitter, label: "X" },
  { icon: Youtube, label: "YouTube" },
];

export default function FinalStrip() {
  return (
    <section className="bg-page px-6 py-20 md:py-[100px]">
      <div className="mx-auto flex max-w-[760px] flex-col items-center gap-7 text-center">
        <SectionKicker className="justify-center">PREFER.EMAIL?</SectionKicker>

        <motion.a
          href="mailto:demo@stackline.io"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="group relative font-display text-[28px] font-semibold tracking-tight text-ink0 transition-colors duration-300 hover:text-brand md:text-[40px]"
        >
          demo@stackline.io
          <span
            aria-hidden
            className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
          />
        </motion.a>

        <div className="flex items-center gap-5">
          {SOCIALS.map((s, i) => (
            <motion.a
              key={s.label}
              href="#"
              aria-label={s.label}
              onClick={(e) => e.preventDefault()}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: EASE }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink1 transition-colors duration-200 hover:border-brand hover:text-brand"
            >
              <s.icon className="h-4 w-4" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
