import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Loader2,
  Package,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-[13px] text-ink0 placeholder:text-ink2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,26,0.4)]";
const labelCls =
  "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-ink1";

function StatusDot({ tone }: { tone: "ok" | "warn" | "crit" | "idle" }) {
  const color =
    tone === "ok" ? "bg-data" : tone === "warn" ? "bg-warn" : tone === "crit" ? "bg-crit" : "bg-ink2";
  return <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse-dot", color)} />;
}

function Badge({ tone, children }: { tone: "demo" | "live"; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em]",
        tone === "demo"
          ? "border-warn/50 bg-[rgba(255,176,32,0.08)] text-warn"
          : "border-data/50 bg-data-soft text-data",
      )}
    >
      <StatusDot tone={tone === "demo" ? "warn" : "ok"} />
      {children}
    </span>
  );
}

function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-crit/30 bg-[rgba(244,80,78,0.06)] px-3 py-2.5">
      <span className="font-mono text-[11px] leading-relaxed text-crit">
        {message || "Backend unreachable"}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink1 transition-colors hover:text-ink0"
      >
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}

function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg border border-line bg-raised" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Config form                                                         */
/* ------------------------------------------------------------------ */

function ConfigForm() {
  const utils = trpc.useUtils();
  const configQuery = trpc.erpnext.getConfig.useQuery(undefined, { retry: 1 });
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const saveMutation = trpc.erpnext.saveConfig.useMutation({
    onSuccess: () => {
      setNotice("Configuration saved — secret stored server-side.");
      setApiSecret("");
      void utils.erpnext.getConfig.invalidate();
      void utils.erpnext.fetchWarehouses.invalidate();
      void utils.erpnext.fetchItems.invalidate();
    },
    onError: () => setNotice(null),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    saveMutation.mutate({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      apiSecret: apiSecret ? apiSecret : undefined,
      enabled: enabled ? 1 : 0,
    });
  };

  const existing = configQuery.data;

  return (
    <BlueprintCard className="p-6 hover:-translate-y-0 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlugZap className="h-5 w-5 text-brand" />
          <h3 className="font-display text-lg font-semibold text-ink0">Connection</h3>
        </div>
        {configQuery.isLoading ? (
          <span className="h-6 w-24 animate-pulse rounded-full border border-line bg-raised" />
        ) : existing ? (
          <Badge tone={existing.enabled ? "live" : "demo"}>
            {existing.enabled ? "Configured" : "Saved · Disabled"}
          </Badge>
        ) : (
          <Badge tone="demo">Not configured</Badge>
        )}
      </div>

      {configQuery.isError && (
        <div className="mt-4">
          <QueryError
            message="Could not load saved config — the API may be offline."
            onRetry={() => void configQuery.refetch()}
          />
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="erp-base-url" className={labelCls}>Base URL</label>
          <input
            id="erp-base-url"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={existing?.baseUrl || "https://erp.acme.com"}
            className={inputCls}
            required={!existing}
          />
        </div>
        <div>
          <label htmlFor="erp-api-key" className={labelCls}>API key</label>
          <input
            id="erp-api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={existing?.apiKey || "Integration user key"}
            className={inputCls}
            required={!existing}
          />
        </div>
        <div>
          <label htmlFor="erp-api-secret" className={labelCls}>API secret</label>
          <input
            id="erp-api-secret"
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder={
              existing?.apiSecretMasked
                ? `${existing.apiSecretMasked} — leave blank to keep`
                : "Integration user secret"
            }
            className={inputCls}
          />
          <p className="mt-1.5 font-mono text-[10px] tracking-[0.06em] text-ink2">
            Stored encrypted. The API only ever returns a masked secret.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 pt-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-line bg-surface accent-[#FF6B1A]"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink1">
            Enable sync immediately
          </span>
        </label>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 py-[13px]",
            "font-display text-[15px] font-semibold text-page transition-all duration-300",
            "hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
          )}
        >
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {existing ? "Update configuration" : "Save configuration"}
        </button>

        {notice && (
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-data">
            <ShieldCheck className="h-3.5 w-3.5" /> {notice}
          </p>
        )}
        {saveMutation.isError && (
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.04em] text-crit">
            {saveMutation.error.message || "Save failed — check the API and try again."}
          </p>
        )}
      </form>
    </BlueprintCard>
  );
}

/* ------------------------------------------------------------------ */
/* Status + test connection                                            */
/* ------------------------------------------------------------------ */

function StatusPanel() {
  const configQuery = trpc.erpnext.getConfig.useQuery(undefined, { retry: 1 });
  const testQuery = trpc.erpnext.testConnection.useQuery(undefined, {
    enabled: false,
    retry: false,
    staleTime: 0,
  });
  const cfg = configQuery.data;

  const rows: Array<[string, string]> = cfg
    ? [
        ["SITE", cfg.baseUrl || "—"],
        ["API KEY", cfg.apiKey || "—"],
        ["SECRET", cfg.apiSecretMasked || "—"],
        ["SYNC", cfg.enabled ? "ENABLED" : "DISABLED"],
        [
          "LAST SYNC",
          cfg.lastSyncAt ? new Date(cfg.lastSyncAt).toLocaleString() : "NEVER",
        ],
      ]
    : [];

  const result = testQuery.data;

  return (
    <BlueprintCard className="p-6 hover:-translate-y-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-data" />
          <h3 className="font-display text-lg font-semibold text-ink0">Site status</h3>
        </div>
        <button
          type="button"
          onClick={() => void testQuery.refetch()}
          disabled={testQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-linestrong px-4 py-2 font-display text-[13px] font-semibold text-ink0 transition-colors duration-300 hover:border-data hover:text-data disabled:opacity-60"
        >
          {testQuery.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlugZap className="h-3.5 w-3.5" />
          )}
          Test connection
        </button>
      </div>

      <div className="mt-5">
        {configQuery.isLoading ? (
          <SkeletonRows rows={5} />
        ) : configQuery.isError ? (
          <QueryError
            message="Status unavailable — API offline."
            onRetry={() => void configQuery.refetch()}
          />
        ) : !cfg ? (
          <p className="rounded-lg border border-line bg-void px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ink2">
            NO CONFIG SAVED — the panel runs on demo data until you connect a site.
          </p>
        ) : (
          <dl className="divide-y divide-line rounded-lg border border-line bg-void">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">{k}</dt>
                <dd className="truncate font-mono text-[12px] tracking-[0.02em] text-ink0">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {testQuery.isError && (
        <div className="mt-4">
          <QueryError
            message={testQuery.error.message}
            onRetry={() => void testQuery.refetch()}
          />
        </div>
      )}
      {result && !testQuery.isFetching && (
        <div
          className={cn(
            "mt-4 flex items-start gap-3 rounded-lg border px-4 py-3",
            result.demo
              ? "border-warn/40 bg-[rgba(255,176,32,0.07)]"
              : result.ok
                ? "border-data/40 bg-data-soft"
                : "border-crit/40 bg-[rgba(244,80,78,0.07)]",
          )}
        >
          <StatusDot tone={result.demo ? "warn" : result.ok ? "ok" : "crit"} />
          <div className="font-mono text-[11px] leading-relaxed tracking-[0.04em]">
            <div className={result.demo ? "text-warn" : result.ok ? "text-data" : "text-crit"}>
              {result.demo
                ? "DEMO MODE"
                : result.ok
                  ? `CONNECTED${"user" in result && result.user ? ` AS ${String(result.user).toUpperCase()}` : ""}`
                  : "CONNECTION FAILED"}
            </div>
            <div className="mt-1 text-ink1">{result.message}</div>
          </div>
        </div>
      )}
    </BlueprintCard>
  );
}

/* ------------------------------------------------------------------ */
/* Synced data panels (warehouses / items)                             */
/* ------------------------------------------------------------------ */

function WarehousesPanel() {
  const q = trpc.erpnext.fetchWarehouses.useQuery(undefined, { retry: 1 });
  const rows = (q.data?.data ?? []) as Array<Record<string, unknown>>;
  const shown = rows.slice(0, 6);
  return (
    <BlueprintCard className="p-6 hover:-translate-y-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Warehouse className="h-5 w-5 text-brand" />
          <h3 className="font-display text-base font-semibold text-ink0">Warehouses</h3>
        </div>
        {q.data && <Badge tone={q.data.demo ? "demo" : "live"}>{q.data.demo ? "Demo mode" : "Live"}</Badge>}
      </div>
      <div className="mt-5">
        {q.isLoading ? (
          <SkeletonRows rows={4} />
        ) : q.isError ? (
          <QueryError message="Warehouse fetch failed." onRetry={() => void q.refetch()} />
        ) : shown.length === 0 ? (
          <p className="font-mono text-[11px] text-ink2">No warehouses returned.</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((w, i) => (
              <li
                key={String(w.name ?? i)}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-void px-3.5 py-2.5"
              >
                <span className="truncate font-mono text-[12px] text-ink0">
                  {String(w.warehouse_name ?? w.name ?? "—")}
                </span>
                <span className="shrink-0 font-mono text-[10px] tracking-[0.1em] text-ink2">
                  {Number(w.is_group) ? "GROUP" : "LEAF"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {rows.length > shown.length && (
          <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-ink2">
            +{rows.length - shown.length} MORE
          </p>
        )}
      </div>
    </BlueprintCard>
  );
}

function ItemsPanel() {
  const q = trpc.erpnext.fetchItems.useQuery(undefined, { retry: 1 });
  const rows = (q.data?.data ?? []) as Array<Record<string, unknown>>;
  const shown = rows.slice(0, 6);
  return (
    <BlueprintCard className="p-6 hover:-translate-y-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-data" />
          <h3 className="font-display text-base font-semibold text-ink0">Items</h3>
        </div>
        {q.data && <Badge tone={q.data.demo ? "demo" : "live"}>{q.data.demo ? "Demo mode" : "Live"}</Badge>}
      </div>
      <div className="mt-5">
        {q.isLoading ? (
          <SkeletonRows rows={4} />
        ) : q.isError ? (
          <QueryError message="Item fetch failed." onRetry={() => void q.refetch()} />
        ) : shown.length === 0 ? (
          <p className="font-mono text-[11px] text-ink2">No items returned.</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((it, i) => (
              <li
                key={String(it.item_code ?? i)}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-void px-3.5 py-2.5"
              >
                <span className="truncate text-[13px] text-ink0">{String(it.item_name ?? "—")}</span>
                <span className="shrink-0 font-mono text-[10px] tracking-[0.1em] text-data">
                  {String(it.item_code ?? "")}
                  {it.stock_uom ? <span className="text-ink2"> · {String(it.stock_uom)}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        {rows.length > shown.length && (
          <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-ink2">
            +{rows.length - shown.length} MORE
          </p>
        )}
      </div>
    </BlueprintCard>
  );
}

/* ------------------------------------------------------------------ */

export default function ConnectionPanel() {
  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>LIVE.CONNECTION</SectionKicker>
        <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="Plug in your site." />
        </h2>
        <p className="mt-5 max-w-[560px] text-base leading-[1.65] text-ink1 md:text-lg">
          This panel is wired to the same API your twin uses. Save credentials,
          test the handshake, and watch real doctypes stream in — or explore in
          demo mode until you do.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mt-12 grid items-start gap-6 lg:grid-cols-2"
        >
          <ConfigForm />
          <div className="space-y-6">
            <StatusPanel />
            <div className="grid items-start gap-6 sm:grid-cols-2">
              <WarehousesPanel />
              <ItemsPanel />
            </div>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
              <Database className="h-3.5 w-3.5" />
              Demo mode returns simulated doctypes until a site is connected
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
