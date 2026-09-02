import { motion, AnimatePresence } from "framer-motion";
import { X, MoveRight, BookmarkPlus, ExternalLink } from "lucide-react";
import { trpc } from "@/providers/trpc";
import {
  capacityColor,
  type BinContentLine,
  type ViewerBin,
} from "@/components/warehouse/data";

function CapacityDot({ fill }: { fill: number }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: capacityColor(fill), boxShadow: `0 0 8px ${capacityColor(fill)}` }}
    />
  );
}

function ContentsTable({ lines }: { lines: BinContentLine[] }) {
  if (lines.length === 0)
    return (
      <div className="rounded-lg border border-dashed border-linestrong px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink2">
        Bin empty — ready for putaway
      </div>
    );
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line bg-surface">
            {["SKU", "QTY", "BATCH", "EXPIRY"].map((h) => (
              <th
                key={h}
                className="px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink2"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={`${l.sku}-${i}`} className="border-b border-line last:border-0">
              <td className="px-3 py-2.5">
                <div className="font-mono text-[12px] text-data">{l.sku}</div>
                <div className="max-w-[130px] truncate text-[11px] text-ink2">{l.name}</div>
              </td>
              <td className="px-3 py-2.5 font-mono text-[13px] font-tnum text-ink0">{l.qty}</td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-ink1">{l.batch}</td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-ink1">{l.expiry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Live capacity cross-check via tRPC (only when the bin is DB-backed). */
function ServerCapacityCheck({ bin }: { bin: ViewerBin }) {
  const contentsQ = trpc.wms.stock.binContents.useQuery(
    { binId: bin.dbId ?? 0 },
    { enabled: bin.dbId != null, retry: 1, refetchOnWindowFocus: false }
  );
  const firstItemId = contentsQ.data?.placements.find((p) => p.item)?.itemId;
  const previewQ = trpc.wms.stock.capacityPreview.useQuery(
    { binId: bin.dbId ?? 0, itemId: firstItemId ?? 0 },
    { enabled: bin.dbId != null && firstItemId != null, retry: 1, refetchOnWindowFocus: false }
  );

  if (bin.dbId == null || !previewQ.data) return null;
  const p = previewQ.data;
  return (
    <div className="mt-3 rounded-lg border border-data/30 bg-data-soft px-3 py-2 font-mono text-[11px] tracking-[0.06em] text-data">
      SERVER CHECK · FITS {p.capacity} × {p.item.sku} · AVAILABLE{" "}
      {p.available}
      {p.weightLimited ? " · WEIGHT-LIMITED" : ""}
    </div>
  );
}

function DrawerBody({ bin, live }: { bin: ViewerBin; live: boolean }) {
  // Prefer live contents when available; fall back to whatever the layout carried
  const contentsQ = trpc.wms.stock.binContents.useQuery(
    { binId: bin.dbId ?? 0 },
    { enabled: live && bin.dbId != null, retry: 1, refetchOnWindowFocus: false }
  );
  const liveLines: BinContentLine[] | null = contentsQ.data
    ? contentsQ.data.placements
        .filter((p) => p.qty > 0)
        .map((p) => ({
          sku: p.item?.sku ?? `ITEM-${p.itemId}`,
          name: p.item?.name ?? "Unknown item",
          qty: p.qty,
          batch: p.batchNo ?? "—",
          expiry: "—",
          cartonWeightKg: p.item?.cartonWeightKg ?? 0,
        }))
    : null;
  const lines = liveLines ?? bin.contents;

  return (
    <>
      <div className="flex items-start justify-between border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CapacityDot fill={bin.fill} />
            <span className="font-mono text-[15px] font-semibold tracking-[0.08em] text-ink0">
              {bin.code}
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            RACK {bin.rackName} · BAY {String(bin.bay).padStart(2, "0")} · LEVEL{" "}
            {String(bin.level).padStart(2, "0")}
            {bin.blocked ? <span className="text-crit"> · BLOCKED</span> : ""}
          </div>
        </div>
        <span
          className={cnChip(live)}
        >
          {live ? "LIVE" : "DEMO"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Capacity bar */}
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            Capacity
          </span>
          <span
            className="font-mono text-[13px] font-semibold font-tnum"
            style={{ color: capacityColor(bin.fill) }}
          >
            {Math.round(bin.fill)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-void">
          <motion.div
            className="h-full rounded-full"
            style={{ background: capacityColor(bin.fill) }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, bin.fill)}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="mt-2 font-mono text-[11px] tracking-[0.06em] text-ink1 font-tnum">
          {bin.usedQty} / {bin.capacityCount} CARTONS · {bin.usedWeightKg} /{" "}
          {bin.maxWeightKg} KG
        </div>

        <ServerCapacityCheck bin={live ? bin : { ...bin, dbId: null }} />

        {/* Contents */}
        <div className="mt-5 mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
          Contents
        </div>
        <ContentsTable lines={lines} />
      </div>

      {/* Actions */}
      <div className="border-t border-line px-5 py-4">
        <div className="flex gap-2.5">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-linestrong px-3 py-2.5 font-display text-[13px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand">
            <MoveRight className="h-3.5 w-3.5" /> Move stock
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-linestrong px-3 py-2.5 font-display text-[13px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand">
            <BookmarkPlus className="h-3.5 w-3.5" /> Reserve
          </button>
        </div>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="group/link mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink1 transition-colors duration-300 hover:text-brand"
        >
          Open in ERPNext
          <ExternalLink className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1" />
        </a>
      </div>
    </>
  );
}

const cnChip = (live: boolean) =>
  live
    ? "rounded border border-data/40 bg-data-soft px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-data"
    : "rounded border border-warn/40 bg-warn/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-warn";

/** Bin detail drawer — springs in from the right (stiffness 260, damping 30). */
export default function BinDrawer({
  bin,
  live,
  onClose,
}: {
  bin: ViewerBin | null;
  live: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {bin && (
        <motion.aside
          key={bin.code}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="absolute inset-y-0 right-0 z-20 flex w-[min(360px,88%)] flex-col border-l border-linestrong bg-raised shadow-2xl"
        >
          <button
            onClick={onClose}
            aria-label="Close bin details"
            className="absolute -left-11 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-linestrong bg-raised text-ink1 transition-colors hover:border-brand hover:text-brand"
          >
            <X className="h-4 w-4" />
          </button>
          <DrawerBody bin={bin} live={live} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
