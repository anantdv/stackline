/**
 * Floor-plan computer vision — deterministic sketch analysis.
 *
 * Given a grayscale raster of a warehouse floor-plan sketch (top view),
 * extracts the warehouse wall bounds, rack-row strips, and bay dividers
 * using Otsu binarization + projection-profile line detection.
 * No external services — runs entirely in-process.
 */

export interface DetectedRow {
  /** px coordinates within the analyzed image */
  x: number;
  y: number;
  w: number;
  h: number;
  /** detected bay count, or null when no bay dividers were found */
  bays: number | null;
}

export interface FloorPlanAnalysis {
  width: number;
  height: number;
  /** wall bounds in px */
  bounds: { x: number; y: number; w: number; h: number };
  rows: DetectedRow[];
  /** aisle gaps between consecutive rows, px */
  aisleGapsPx: number[];
  /** 0..1 detection confidence */
  score: number;
  notes: string[];
  /** dark-ink threshold used */
  threshold: number;
}

/** Otsu's method — optimal global threshold for a grayscale histogram. */
export function otsuThreshold(gray: Uint8Array): number {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestT = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      bestT = t;
    }
  }
  return bestT;
}

interface HLine {
  y: number;
  x0: number;
  x1: number;
  coverage: number; // fraction of [x0..x1] that is ink within the band
  yStart: number;   // cluster extent — thick clusters are whole strips, not lines
  yEnd: number;
}

interface Cluster {
  center: number;
  start: number;
  end: number;
}

function clusterWithExtents(pos: number[], gap: number): Cluster[] {
  if (pos.length === 0) return [];
  const out: Cluster[] = [];
  let start = pos[0];
  let prev = pos[0];
  for (let i = 1; i < pos.length; i++) {
    if (pos[i] - prev > gap) {
      out.push({ center: Math.round((start + prev) / 2), start, end: prev });
      start = pos[i];
    }
    prev = pos[i];
  }
  out.push({ center: Math.round((start + prev) / 2), start, end: prev });
  return out;
}

/** Otsu breaks on hard-bimodal scans (pure black ink on pure white paper → t=0).
 *  Fall back to the midpoint between the dark and light cluster means. */
function robustThreshold(gray: Uint8Array): number {
  const t = otsuThreshold(gray);
  if (t >= 24 && t <= 232) return t;
  let darkSum = 0, darkN = 0, lightSum = 0, lightN = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < 128) { darkSum += gray[i]; darkN++; }
    else { lightSum += gray[i]; lightN++; }
  }
  if (darkN === 0 || lightN === 0) return 128;
  const darkMean = darkSum / darkN;
  const lightMean = lightSum / lightN;
  return Math.max(16, Math.round((darkMean + lightMean) / 2));
}

export function analyzeFloorPlan(
  gray: Uint8Array,
  width: number,
  height: number,
): FloorPlanAnalysis {
  const notes: string[] = [];
  let threshold = robustThreshold(gray);

  // ink = dark pixels on light background; invert if the image is mostly dark
  let darkCount = 0;
  for (let i = 0; i < gray.length; i++) if (gray[i] < threshold) darkCount++;
  const inverted = darkCount / gray.length > 0.55;
  const isInk = (i: number) =>
    inverted ? gray[i] > threshold : gray[i] < threshold;
  if (inverted) notes.push("dark-background image — inverted polarity");

  // content bounding box
  let bx0 = width, bx1 = -1, by0 = height, by1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isInk(y * width + x)) {
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
      }
    }
  }
  if (bx1 < 0 || bx1 - bx0 < 40 || by1 - by0 < 40) {
    return {
      width,
      height,
      bounds: { x: 0, y: 0, w: width, h: height },
      rows: [],
      aisleGapsPx: [],
      score: 0,
      notes: ["no usable drawing found — upload a clearer plan"],
      threshold,
    };
  }
  const bw = bx1 - bx0 + 1;
  const bh = by1 - by0 + 1;

  // horizontal line detection via row projection (band = ±2 px)
  const detectHLines = (coverFrac: number): HLine[] => {
    const rowsHit: number[] = [];
    for (let y = by0; y <= by1; y++) {
      let c = 0;
      for (let yy = Math.max(by0, y - 2); yy <= Math.min(by1, y + 2); yy++) {
        for (let x = bx0; x <= bx1; x++) if (isInk(yy * width + x)) c++;
      }
      // c counts ink over a 5-row band → density ≈ line thickness × line span
      if (c / (5 * bw) >= coverFrac) rowsHit.push(y);
    }
    const clusters = clusterWithExtents(rowsHit, 4);
    return clusters.map((cl) => {
      const cy = cl.center;
      // ink extent within ±3 px band around the line
      let x0 = bx1, x1 = bx0, ink = 0;
      for (let yy = Math.max(by0, cy - 3); yy <= Math.min(by1, cy + 3); yy++) {
        for (let x = bx0; x <= bx1; x++) {
          if (isInk(yy * width + x)) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            ink++;
          }
        }
      }
      const span = Math.max(1, x1 - x0 + 1);
      return { y: cy, x0, x1, coverage: ink / (7 * span), yStart: cl.start, yEnd: cl.end };
    });
  };

  let lines = detectHLines(0.1);
  if (lines.length < 2) {
    lines = detectHLines(0.05);
    if (lines.length >= 2) notes.push("low-contrast scan — sensitive line detection used");
  }

  // snap bounds to the outermost full-span lines (the walls) when possible
  let bounds = { x: bx0, y: by0, w: bw, h: bh };
  if (lines.length >= 4) {
    const lx0 = Math.min(...lines.map((l) => l.x0));
    const lx1 = Math.max(...lines.map((l) => l.x1));
    const top = lines[0].y;
    const bottom = lines[lines.length - 1].y;
    if (bottom - top > bh * 0.4 && lx1 - lx0 > bw * 0.4) {
      bounds = { x: lx0, y: top, w: lx1 - lx0, h: bottom - top };
      notes.push("wall bounds snapped to outermost lines");
    }
  }

  // pair consecutive horizontal lines into rack-row strips.
  // a rack row is a pair of parallel lines close together (the strip edges);
  // prefer the tightest plausible pairing so aisles are never swallowed.
  const minGap = Math.max(6, Math.round(bh * 0.008));
  const maxGap = Math.round(bh * 0.08);
  const rows: DetectedRow[] = [];
  const used = new Set<number>();
  // candidate adjacent pairs, tightest first — rack strips pair before walls/aisles
  const candidates: Array<{ i: number; gap: number }> = [];
  for (let i = 0; i < lines.length - 1; i++) {
    candidates.push({ i, gap: lines[i + 1].y - lines[i].y });
  }
  candidates.sort((a, b) => a.gap - b.gap);
  for (const { i, gap } of candidates) {
    if (used.has(i) || used.has(i + 1)) continue;
    if (gap < minGap || gap > maxGap) continue;
    const a = lines[i];
    const b = lines[i + 1];
    const ox0 = Math.max(a.x0, b.x0);
    const ox1 = Math.min(a.x1, b.x1);
    if (ox1 - ox0 < bw * 0.2) continue; // lines must substantially overlap
    used.add(i);
    used.add(i + 1);
    rows.push({ x: ox0, y: a.y, w: ox1 - ox0, h: gap, bays: null });
  }
  // fallback: filled/thick strips merge their edges into one thick cluster —
  // treat any unpaired thick cluster as a row directly
  for (let i = 0; i < lines.length; i++) {
    if (used.has(i)) continue;
    const l = lines[i];
    const thickness = l.yEnd - l.yStart + 1;
    // walls are the outermost lines (bounds are snapped to them) — exclude
    const nearWall =
      Math.abs(l.y - bounds.y) < 10 || Math.abs(l.y - (bounds.y + bounds.h)) < 10;
    if (!nearWall && thickness >= 12 && thickness <= maxGap) {
      rows.push({ x: l.x0, y: l.yStart, w: l.x1 - l.x0, h: thickness, bays: null });
    }
  }
  rows.sort((a, b) => a.y - b.y);

  // bay dividers: vertical ink inside each strip
  for (const row of rows) {
    const divs: number[] = [];
    const inset = Math.max(1, Math.round(row.h * 0.18));
    const yTop = row.y + inset;
    const yBot = row.y + row.h - inset;
    for (let x = row.x; x <= row.x + row.w; x++) {
      let c = 0;
      for (let y = yTop; y <= yBot; y++) {
        if (isInk(y * width + x)) c++;
      }
      if (c >= (yBot - yTop + 1) * 0.45) divs.push(x);
    }
    const centers = clusterWithExtents(divs, Math.max(3, Math.round(row.w * 0.008))).map((c) => c.center).filter(
      (x) => x > row.x + 3 && x < row.x + row.w - 3,
    );
    if (centers.length > 0 && centers.length <= 200) row.bays = centers.length + 1;
  }

  const aisleGapsPx: number[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    aisleGapsPx.push(rows[i + 1].y - (rows[i].y + rows[i].h));
  }

  const withBays = rows.filter((r) => r.bays !== null).length;
  let score = 0;
  if (rows.length > 0) {
    score = Math.min(
      1,
      0.35 +
        Math.min(0.3, rows.length * 0.06) +
        (rows.length > 0 ? (withBays / rows.length) * 0.3 : 0) +
        0.05,
    );
  }
  if (rows.length > 0 && withBays === 0)
    notes.push("no bay dividers detected — bay counts estimated from standard 2.7 m bays");
  else if (withBays < rows.length)
    notes.push("some rows had no bay dividers — their bays were estimated");

  return {
    width,
    height,
    bounds,
    rows,
    aisleGapsPx,
    score: Math.round(score * 100) / 100,
    notes,
    threshold,
  };
}
