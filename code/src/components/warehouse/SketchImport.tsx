import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router";
import { FileUp, Loader2, ScanLine, Box, AlertTriangle, Check } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";

/**
 * Real sketch → 3D twin import.
 * The browser decodes the upload (any image format, EXIF orientation applied),
 * downscales and converts to grayscale on a canvas, then the server pipeline
 * binarizes, deskews, detects walls/rack rows/bays and builds the live twin.
 */

type Phase =
  | { step: "idle" }
  | { step: "preparing" }
  | { step: "analyzing" }
  | { step: "done"; result: AnalyzeResult }
  | { step: "error"; message: string };

interface AnalyzeResult {
  warehouseId: number;
  warehouseCode: string;
  racks: number;
  bins: number;
  levels: number;
  confidence: number;
  notes: string[];
  rows: Array<{ name: string; bays: number; baysDetected: boolean }>;
  preview: { imageBase64: string };
}

interface Prepared {
  grayBase64: string;
  imageWidth: number;
  imageHeight: number;
}

/** Decode any browser-supported image → EXIF-corrected ≤1600px grayscale. */
async function preprocess(file: File): Promise<Prepared> {
  // Decode-time downscale keeps memory flat even for 50MP phone photos —
  // decoding full-res first can OOM the tab (blank page) on mobile.
  const MAX = 1600;
  let bitmap: ImageBitmap | null = null;
  try {
    // probe dimensions without full decode where possible
    const probe = await createImageBitmap(file);
    const scale = Math.min(1, MAX / Math.max(probe.width, probe.height));
    const w = Math.max(200, Math.round(probe.width * scale));
    const h = Math.max(200, Math.round(probe.height * scale));
    probe.close();
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
      resizeWidth: w,
      resizeHeight: h,
      resizeQuality: "high",
    } as ImageBitmapOptions);
    // some engines ignore resize options — verify
    if (bitmap.width > MAX * 1.5 || bitmap.height > MAX * 1.5) {
      bitmap.close();
      bitmap = null;
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("canvas unavailable");
      ctx.fillStyle = "#fff";
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return grayFromCanvas(ctx, canvas.width, canvas.height);
    }
  } catch {
    if (bitmap) { bitmap.close(); bitmap = null; }
    // fall through to <img> path
  }
  // Fallback: HTMLImageElement decode + canvas downscale
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(200, Math.round(img.naturalWidth * scale));
    const h = Math.max(200, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("canvas unavailable");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return grayFromCanvas(ctx, w, h);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function grayFromCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): Prepared {
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = Math.round(0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2]);
  }
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < gray.length; i += CHUNK) {
    bin += String.fromCharCode(...gray.subarray(i, i + CHUNK));
  }
  return { grayBase64: btoa(bin), imageWidth: w, imageHeight: h };
}

function NumField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
        {label}
      </span>
      <span className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full bg-transparent font-mono text-[13px] text-ink0 outline-none"
        />
        <span className="font-mono text-[10px] text-ink2">{unit}</span>
      </span>
    </label>
  );
}

export default function SketchImport() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = (user as { role?: string } | null)?.role === "admin";
  const utils = trpc.useUtils();
  const analyze = trpc.twin.analyzeSketch.useMutation();

  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [lengthM, setLengthM] = useState(60);
  const [widthM, setWidthM] = useState(40);
  const [heightM, setHeightM] = useState(12);
  const [levels, setLevels] = useState(4);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = async (f?: File | null) => {
    if (!f) return;
    setFileName(f.name);
    if (!name) setName(f.name.replace(/\.[^.]+$/, "").slice(0, 60) || "New Warehouse");
    if (!code) {
      const c = f.name.replace(/\.[^.]+$/, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16);
      setCode(c || "WH-NEW");
    }
    setPhase({ step: "preparing" });
    try {
      setPrepared(await preprocess(f));
      setPhase({ step: "idle" });
    } catch {
      setPrepared(null);
      setPhase({
        step: "error",
        message: "Your browser could not decode this file — save it as PNG or JPEG and retry.",
      });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    acceptFile(e.dataTransfer.files?.[0]);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    acceptFile(e.target.files?.[0]);

  const run = async () => {
    if (!prepared) return;
    setPhase({ step: "analyzing" });
    try {
      const result = (await analyze.mutateAsync({
        ...prepared,
        name,
        code,
        lengthM,
        widthM,
        heightM,
        levels,
      })) as AnalyzeResult;
      setPhase({ step: "done", result });
      // refresh every live surface that lists warehouses/layouts —
      // invalidation failure must never mask a successful build
      try {
        await utils.wms.warehouses.list.invalidate();
        await utils.wms.layout.getFullLayout.invalidate();
      } catch {
        /* non-fatal: lists refresh on next focus anyway */
      }
    } catch (e: any) {
      setPhase({
        step: "error",
        message: e?.message ?? "analysis failed — try a clearer plan",
      });
    }
  };

  const busy = phase.step === "preparing" || phase.step === "analyzing";

  return (
    <div className="mt-8">
      {/* drop zone — input is a sibling, NOT nested in the button:
          a <input type=file> inside a <button> double-fires the click
          handler and is invalid HTML (interactive content in a button) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "flex w-full items-center gap-4 rounded-xl border border-dashed px-5 py-4 text-left transition-colors duration-300",
          prepared
            ? "border-data/50 bg-data-soft"
            : "border-linestrong bg-surface hover:border-brand",
        )}
      >
        {phase.step === "preparing" ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" />
        ) : prepared ? (
          <Check className="h-5 w-5 shrink-0 text-data" />
        ) : (
          <FileUp className="h-5 w-5 shrink-0 text-brand" />
        )}
        <span className="flex-1">
          <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink0">
            {phase.step === "preparing"
              ? `Preparing ${fileName}…`
              : prepared
                ? `${fileName} — ready for analysis`
                : "Drop floor-plan sketch or photo — any image format"}
          </span>
          <span className="mt-0.5 block text-[12px] text-ink2">
            {prepared
              ? "Set the real building dimensions below, then build the twin."
              : "The pipeline binarizes, deskews and detects walls, rack rows and bays automatically."}
          </span>
        </span>
        <span className="hidden font-mono text-[10px] tracking-[0.14em] text-ink2 sm:block">
          01 IMPORT
        </span>
      </button>

      {/* dimensions + build */}
      {prepared && phase.step !== "done" && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            Real-world scale — the sketch gives structure, these give meters
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">Warehouse name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-page px-3 py-2 font-mono text-[13px] text-ink0 outline-none"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">Code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-line bg-page px-3 py-2 font-mono text-[13px] text-ink0 outline-none"
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NumField label="Length" unit="M" value={lengthM} onChange={setLengthM} />
            <NumField label="Width" unit="M" value={widthM} onChange={setWidthM} />
            <NumField label="Height" unit="M" value={heightM} onChange={setHeightM} />
            <NumField label="Levels" unit="×" value={levels} onChange={setLevels} />
          </div>

          {!authLoading && !isAuthenticated && (
            <div className="mt-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-[13px] text-ink1">
              Building a twin writes to the live database —{" "}
              <Link to={LOGIN_PATH} className="font-semibold text-brand underline">
                sign in
              </Link>{" "}
              with an administrator account first.
            </div>
          )}
          {!authLoading && isAuthenticated && !isAdmin && (
            <div className="mt-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-[13px] text-ink1">
              Your account has the User role — layout creation needs an Administrator.
            </div>
          )}

          <button
            onClick={run}
            disabled={busy || !isAdmin || !name || !code || lengthM < 5 || widthM < 5}
            className="group/btn relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand px-6 py-[13px] font-display text-[15px] font-semibold text-page transition-all duration-300 hover:-translate-y-px hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase.step === "analyzing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing — binarize · deskew · detect rows & bays…
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" />
                Analyze sketch & build twin
              </>
            )}
          </button>

          {phase.step === "error" && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-crit/40 bg-crit/10 px-4 py-3 text-[13px] text-crit">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {phase.message}
            </div>
          )}
        </div>
      )}

      {/* result */}
      {phase.step === "done" && (
        <div className="mt-4 rounded-xl border border-data/40 bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-data">
              Twin built — {phase.result.warehouseCode}
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-ink2">
              CONFIDENCE {((phase.result.confidence ?? 0) * 100).toFixed(0)}%
            </span>
          </div>

          {/* server-annotated preview: orange = walls, teal = rack rows */}
          {phase.result.preview?.imageBase64 && (
            <>
              <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-lg border border-line">
                <img
                  src={phase.result.preview.imageBase64}
                  alt="Analyzed floor plan with detected structure"
                  className="block h-auto w-full"
                />
              </div>
              <div className="mt-2 flex justify-center gap-4 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-[2px] bg-brand" /> walls
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-[2px] bg-data" /> rack rows
                </span>
              </div>
            </>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              [String(phase.result.racks), "RACK ROWS"],
              [String(phase.result.bins), "BINS CREATED"],
              [`${phase.result.levels}`, "LEVELS"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-line bg-page px-2 py-3">
                <div className="font-display text-xl font-semibold text-ink0">{v}</div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink2">
            {(phase.result.rows ?? []).map((r) => (
              <div key={r.name} className="flex justify-between">
                <span>ROW {r.name}</span>
                <span>
                  {r.bays} BAYS {r.baysDetected ? "· DETECTED" : "· ESTIMATED"}
                </span>
              </div>
            ))}
            {(phase.result.notes ?? []).map((n, i) => (
              <div key={i} className="flex items-center gap-1.5 text-warn">
                <AlertTriangle className="h-3 w-3" /> {n}
              </div>
            ))}
          </div>

          <a
            href="#viewer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-data px-6 py-[12px] font-display text-[15px] font-semibold text-page transition-transform duration-300 hover:-translate-y-px"
          >
            <Box className="h-4 w-4" />
            Open in the 3D viewer above
          </a>
          <button
            onClick={() => {
              setPhase({ step: "idle" });
              setPrepared(null);
              setFileName(null);
            }}
            className="mt-2 w-full rounded-lg border border-line px-6 py-[10px] font-mono text-[11px] uppercase tracking-[0.14em] text-ink1 transition-colors hover:border-brand hover:text-ink0"
          >
            Import another sketch
          </button>
        </div>
      )}
    </div>
  );
}
