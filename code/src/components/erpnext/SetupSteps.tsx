import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Copy, Download, KeyRound, Map, Radio } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const COMMAND =
  "bench get-app stackline && bench --site erp.acme.com install-app stackline";

const STEPS = [
  {
    n: "01",
    name: "INSTALL",
    icon: Download,
    copy: "Install the Stackline app on your Frappe site:",
    code: true,
  },
  {
    n: "02",
    name: "AUTHORIZE",
    icon: KeyRound,
    copy: "Generate an API key/secret pair; Stackline stores credentials encrypted and scopes them to a dedicated integration user.",
    code: false,
  },
  {
    n: "03",
    name: "MAP",
    icon: Map,
    copy: "Point each physical zone to its ERPNext warehouse. Import existing bins, items and UOMs in one pass.",
    code: false,
  },
  {
    n: "04",
    name: "GO LIVE",
    icon: Radio,
    copy: "Webhooks + Socket.IO stream every document. Median sync latency: 12 ms.",
    code: false,
  },
];

/** Types the bench command at 24ms/char once scrolled into view. */
function TypingCommand() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduced = useReducedMotion();
  const [len, setLen] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      const id = window.setTimeout(() => setLen(COMMAND.length), 0);
      return () => window.clearTimeout(id);
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setLen(i);
      if (i >= COMMAND.length) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
    } catch {
      /* clipboard unavailable — ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const done = len >= COMMAND.length;

  return (
    <div ref={ref} className="relative mt-4 rounded-lg border border-line bg-void p-3 pr-11">
      <code className="block whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-ink1">
        <span className="text-brand">$ </span>
        <span>
          {COMMAND.slice(0, len).split("stackline").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <span className="text-data">stackline</span>}
            </span>
          ))}
        </span>
        {!done && <span className="ml-0.5 inline-block h-3 w-[7px] translate-y-[2px] bg-brand animate-caret-blink" />}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy install command"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink2 transition-colors hover:border-linestrong hover:text-ink0"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-data" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function SetupSteps() {
  return (
    <section className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>SETUP</SectionKicker>
        <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="Connected before lunch." />
        </h2>
        <p className="mt-5 max-w-[540px] text-base leading-[1.65] text-ink1 md:text-lg">
          Four steps, one bench command, zero middleware. The app installs like
          any other Frappe app.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: EASE }}
            >
              <BlueprintCard className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <motion.span
                    initial={{ backgroundColor: "rgba(255,107,26,0)", color: "#5C6773" }}
                    whileInView={{ backgroundColor: "rgba(255,107,26,0.14)", color: "#FF6B1A" }}
                    viewport={{ once: true, margin: "-12% 0px" }}
                    transition={{ delay: 0.2 + i * 0.18, duration: 0.5 }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/40 font-mono text-[11px]"
                  >
                    {step.n}
                  </motion.span>
                  <step.icon className="h-5 w-5 text-ink2" />
                </div>
                <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-brand">
                  {step.name}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink1">{step.copy}</p>
                {step.code && <TypingCommand />}
              </BlueprintCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
