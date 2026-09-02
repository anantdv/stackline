import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import type { DemoDoc } from "./data";
import { docFormSpec, type DocFormSpec } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Deterministic pseudo-QR block (SVG) — visual mock of the signed IRN QR. */
function QrBlock({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let s = 0;
    for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) % 2147483647;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const n = 15;
    const out: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (rand() > 0.52) out.push({ x, y });
    return out;
  }, [seed]);
  return (
    <svg viewBox="0 0 15 15" className="h-24 w-24 text-ink0" aria-label="IRN QR code (demo)">
      <rect width="15" height="15" className="fill-surface" />
      {/* finder squares */}
      {[
        [0, 0],
        [11, 0],
        [0, 11],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x={x + 1.4} y={y + 1.4} width="1.2" height="1.2" fill="currentColor" />
        </g>
      ))}
      {cells.map((c, i) => (
        <rect key={i} x={c.x + 0.08} y={c.y + 0.08} width="0.84" height="0.84" fill="currentColor" />
      ))}
    </svg>
  );
}

function FieldGrid({ spec }: { spec: DocFormSpec }) {
  return (
    <div className="space-y-5">
      {spec.sections.map((sec) => (
        <div key={sec.heading}>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand">{sec.heading}</span>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line">
            {sec.fields.map((f) => (
              <div key={f.label} className="grid grid-cols-[128px_1fr] gap-3 bg-surface px-3 py-2">
                <dt className="font-mono text-[9px] uppercase leading-5 tracking-[0.12em] text-ink2">{f.label}</dt>
                <dd className="break-all font-mono text-[11px] leading-5 tracking-[0.04em] text-ink0">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/**
 * DocPreviewDrawer (design-delta §4.6): right drawer, 420px, mono field list
 * styled like the real statutory form. Prefers live tRPC payload when the doc
 * carries a DB id; otherwise renders the baked demo form.
 */
export default function DocPreviewDrawer({
  doc,
  onClose,
}: {
  doc: DemoDoc | null;
  onClose: () => void;
}) {
  const preview = trpc.compliance.previewDoc.useQuery(
    { id: doc?.dbId ?? 0 },
    { enabled: doc?.dbId != null, retry: 1, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const spec = useMemo(() => {
    if (!doc) return null;
    const base = docFormSpec(doc);
    const payload = preview.data?.payload;
    if (payload && typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      const extra = Object.entries(p)
        .filter(([, v]) => v != null && typeof v !== "object")
        .map(([k, v]) => ({ label: k.replace(/([A-Z])/g, " $1").toUpperCase(), value: String(v) }));
      if (extra.length > 0) {
        return {
          ...base,
          sections: [{ heading: "LIVE PAYLOAD · ERPNEXT", fields: extra }, ...base.sections],
        };
      }
    }
    return base;
  }, [doc, preview.data]);

  return (
    <AnimatePresence>
      {doc && spec && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[70] bg-void/60"
            style={{ background: "var(--guide-dim)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label={`${spec.title} preview`}
            className="fixed bottom-0 right-0 top-0 z-[80] flex w-full max-w-[420px] flex-col border-l border-linestrong bg-page shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink2">
                  DOCUMENT PREVIEW {preview.data ? "· LIVE" : "· DEMO"}
                </div>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink0">{spec.title}</h3>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink1">{spec.subtitle}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close document preview"
                className="rounded-md border border-line p-1.5 text-ink1 transition-colors hover:border-linestrong hover:text-ink0"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {spec.qr && (
                <div className="flex items-center gap-4 rounded-md border border-line bg-surface p-4">
                  <QrBlock seed={doc.docNo || doc.docType} />
                  <div className="font-mono text-[9px] uppercase leading-5 tracking-[0.14em] text-ink2">
                    SIGNED QR
                    <br />
                    <span className="text-data">IRP VERIFIED ✓</span>
                    <br />
                    SCAN TO VALIDATE
                  </div>
                </div>
              )}
              <FieldGrid spec={spec} />
              <div
                className={cn(
                  "rounded-md border border-dashed px-3 py-2 text-center font-mono text-[9px] uppercase tracking-[0.16em]",
                  doc.status === "expired" ? "border-crit/50 text-crit" : "border-line text-ink2"
                )}
              >
                {doc.status === "expired"
                  ? "VALIDITY LAPSED — MOVEMENT BLOCKED AT GATE"
                  : "AUTO-ATTACHED TO SHIPMENT · AUDIT TRAIL IN ERPNEXT"}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
