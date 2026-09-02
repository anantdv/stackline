import { useState } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import { GhostButton } from "@/components/Buttons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EASE, RackAssembly } from "@/components/contact/shared";

const ERP_STATUS = ["Running v15", "Running v14", "Evaluating", "Not yet"];
const WH_SIZES = ["< 2,000 bins", "2–15k bins", "15k+ bins", "Multiple sites"];
const PLAN_OPTIONS = ["YES", "NO", "SKETCH"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "h-11 rounded-lg border-line bg-surface font-mono text-sm text-ink0 placeholder:text-ink2 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40";

function sizeFromBins(bins: number): string {
  if (bins < 2000) return WH_SIZES[0];
  if (bins <= 15000) return WH_SIZES[1];
  return WH_SIZES[2];
}

type FormState = {
  name: string;
  email: string;
  company: string;
  erpStatus: string;
  whSize: string;
  floorPlan: (typeof PLAN_OPTIONS)[number];
  message: string;
};

function SuccessPanel() {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center gap-6 py-6 text-center"
    >
      <RackAssembly className="h-44 w-full max-w-[320px]" />
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-3xl font-semibold tracking-tight text-ink0">
          Twin queued.
        </h3>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-data">
          REF #SL-2841 · We'll email your slot
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink1">
          Your request is in the queue. Expect a calendar link within 4 business hours.
        </p>
      </div>
      <GhostButton to="/">Back to home</GhostButton>
    </motion.div>
  );
}

export default function DemoForm() {
  const [params] = useSearchParams();
  const binsParam = Number(params.get("bins"));
  const prefillSize =
    Number.isFinite(binsParam) && binsParam > 0 ? sizeFromBins(binsParam) : "";

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    erpStatus: "",
    whSize: prefillSize,
    floorPlan: "YES",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "REQUIRED — WHO DO WE ASK FOR?";
    if (!form.email.trim()) next.email = "REQUIRED — WHERE DO WE SEND THE SLOT?";
    else if (!EMAIL_RE.test(form.email)) next.email = "INVALID — CHECK THE ADDRESS FORMAT";
    if (!form.company.trim()) next.company = "REQUIRED — WHICH FLOOR ARE WE TWINNING?";
    if (!form.erpStatus) next.erpStatus = "REQUIRED — PICK YOUR ERPNEXT STATUS";
    if (!form.whSize) next.whSize = "REQUIRED — PICK A SIZE BAND";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStatus("loading");
    window.setTimeout(() => setStatus("success"), 1100);
  };

  const err = (key: keyof FormState) =>
    errors[key] ? (
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-crit">
        {errors[key]}
      </span>
    ) : null;

  return (
    <BlueprintCard className="p-7 hover:-translate-y-0 md:p-9">
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <SuccessPanel key="ok" />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink0">
                Book your live demo
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-data">
                Response &lt; 4 business hours
              </span>
            </div>

            <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-5">
              {[
                <div key="r1" className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cf-name" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
                      Full name
                    </Label>
                    <Input
                      id="cf-name"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="J. OPEZ"
                      aria-invalid={!!errors.name}
                      className={fieldClass}
                    />
                    {err("name")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cf-email" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
                      Work email
                    </Label>
                    <Input
                      id="cf-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="OPS@COMPANY.COM"
                      aria-invalid={!!errors.email}
                      className={fieldClass}
                    />
                    {err("email")}
                  </div>
                </div>,

                <div key="r2" className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cf-company" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
                      Company
                    </Label>
                    <Input
                      id="cf-company"
                      value={form.company}
                      onChange={(e) => set("company", e.target.value)}
                      placeholder="ACME LOGISTICS"
                      aria-invalid={!!errors.company}
                      className={fieldClass}
                    />
                    {err("company")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
                      ERPNext status
                    </Label>
                    <Select value={form.erpStatus} onValueChange={(v) => set("erpStatus", v)}>
                      <SelectTrigger
                        aria-invalid={!!errors.erpStatus}
                        className="h-11 rounded-lg border-line bg-surface font-mono text-sm text-ink0 focus:border-brand focus:ring-2 focus:ring-brand/40"
                      >
                        <SelectValue placeholder="SELECT…" />
                      </SelectTrigger>
                      <SelectContent className="border-line bg-raised font-mono text-sm text-ink0">
                        {ERP_STATUS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {err("erpStatus")}
                  </div>
                </div>,

                <div key="r3" className="flex flex-col gap-2">
                  <Label className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
                    Warehouse size
                  </Label>
                  <Select value={form.whSize} onValueChange={(v) => set("whSize", v)}>
                    <SelectTrigger
                      aria-invalid={!!errors.whSize}
                      className="h-11 rounded-lg border-line bg-surface font-mono text-sm text-ink0 focus:border-brand focus:ring-2 focus:ring-brand/40"
                    >
                      <SelectValue placeholder="SELECT…" />
                    </SelectTrigger>
                    <SelectContent className="border-line bg-raised font-mono text-sm text-ink0">
                      {WH_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err("whSize")}
                </div>,

                <div key="r4" className="flex flex-col gap-2">
                  <Label className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
                    Floor plan ready?
                  </Label>
                  <div className="inline-flex w-fit items-center rounded-lg border border-linestrong bg-void/50 p-1">
                    {PLAN_OPTIONS.map((opt) => {
                      const active = form.floorPlan === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set("floorPlan", opt)}
                          aria-pressed={active}
                          className={cn(
                            "relative rounded-md px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-200",
                            active ? "text-page" : "text-ink1 hover:text-ink0"
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="floorplan-pill"
                              className="absolute inset-0 rounded-md bg-brand"
                              transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            />
                          )}
                          <span className="relative z-10">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>,

                <div key="r5" className="flex flex-col gap-2">
                  <Label htmlFor="cf-msg" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink1">
                    Message
                  </Label>
                  <Textarea
                    id="cf-msg"
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Tell us about your floor — racks, SKUs, pain points…"
                    rows={4}
                    className="min-h-[110px] rounded-lg border-line bg-surface font-mono text-sm text-ink0 placeholder:text-ink2 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40"
                  />
                </div>,

                <button
                  key="submit"
                  type="submit"
                  disabled={status === "loading"}
                  className={cn(
                    "group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg",
                    "bg-brand px-6 py-[13px] font-display text-[15px] font-semibold text-page",
                    "transition-all duration-300 hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]",
                    "disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-500 group-hover/btn:left-[120%] group-hover/btn:opacity-100"
                  />
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Queuing twin…
                    </>
                  ) : (
                    "Request my twin demo"
                  )}
                </button>,

                <p key="fine" className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                  We reply with a calendar link. No sequences, no spam.
                </p>,
              ].map((node, i) => (
                <motion.div
                  key={node.key ?? i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: EASE }}
                >
                  {node}
                </motion.div>
              ))}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </BlueprintCard>
  );
}
