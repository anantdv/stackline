/**
 * Pure-JS image pipeline for sketch → twin.
 * Input is a grayscale raster preprocessed in the browser (canvas handles
 * format decode + EXIF orientation + downscale), so the server never decodes
 * multi-hundred-megapixel photos — no native modules, no OOM surface.
 */
import { PNG } from "pngjs";

export interface GrayImage {
  data: Uint8Array;
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/* Adaptive binarization (local mean via summed-area table)            */
/* ------------------------------------------------------------------ */

/** Local-mean threshold: ink = pixel < neighbourhoodMean - C.
 *  Handles shadows and uneven lighting that break global thresholds. */
export function adaptiveBinarize(
  img: GrayImage,
  windowRadius = 20,
  C = 14,
): Uint8Array {
  const { data, width: w, height: h } = img;
  const n = w * h;
  // summed-area table (int32 is fine: 1600*1600*255 ≈ 6.5e8 < 2^31 … use float64 to be safe)
  const sat = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    const rowBase = y * w;
    const satRow = (y + 1) * (w + 1);
    const satPrev = y * (w + 1);
    for (let x = 0; x < w; x++) {
      rowSum += data[rowBase + x];
      sat[satRow + x + 1] = sat[satPrev + x + 1] + rowSum;
    }
  }
  const out = new Uint8Array(n); // 0 = ink, 255 = paper
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - windowRadius);
    const y1 = Math.min(h - 1, y + windowRadius);
    const rowBase = y * w;
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - windowRadius);
      const x1 = Math.min(w - 1, x + windowRadius);
      const sum =
        sat[(y1 + 1) * (w + 1) + x1 + 1] -
        sat[y0 * (w + 1) + x1 + 1] -
        sat[(y1 + 1) * (w + 1) + x0] +
        sat[y0 * (w + 1) + x0];
      const mean = sum / ((y1 - y0 + 1) * (x1 - x0 + 1));
      out[rowBase + x] = data[rowBase + x] < mean - C ? 0 : 255;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Rotation + deskew                                                    */
/* ------------------------------------------------------------------ */

export function rotateGray(
  img: GrayImage,
  angleRad: number,
  fill: number,
  bilinear: boolean,
): GrayImage {
  const { data, width: w, height: h } = img;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  // rotated canvas bounds
  const nw = Math.ceil(Math.abs(w * cos) + Math.abs(h * sin));
  const nh = Math.ceil(Math.abs(w * sin) + Math.abs(h * cos));
  const out = new Uint8Array(nw * nh).fill(fill);
  const cx = w / 2;
  const cy = h / 2;
  const ncx = nw / 2;
  const ncy = nh / 2;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      // inverse map
      const dx = x - ncx;
      const dy = y - ncy;
      const sx = dx * cos + dy * sin + cx;
      const sy = -dx * sin + dy * cos + cy;
      if (sx < 0 || sy < 0 || sx >= w - 1 || sy >= h - 1) continue;
      let v: number;
      if (bilinear) {
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const fx = sx - x0;
        const fy = sy - y0;
        const i00 = y0 * w + x0;
        v =
          data[i00] * (1 - fx) * (1 - fy) +
          data[i00 + 1] * fx * (1 - fy) +
          data[i00 + w] * (1 - fx) * fy +
          data[i00 + w + 1] * fx * fy;
      } else {
        v = data[Math.round(sy) * w + Math.round(sx)];
      }
      out[y * nw + x] = v;
    }
  }
  return { data: out, width: nw, height: nh };
}

/** Projection-variance deskew: the rotation that makes horizontal lines
 *  most axis-aligned maximises the variance of the row-ink profile.
 *  Coarse sweep ±8° then refine ±1° at 0.2°. Works on a small binary copy. */
export function deskewBinary(bin: GrayImage): { image: GrayImage; angleDeg: number } {
  const thumb = downscaleGray(bin, 480);
  const score = (img: GrayImage): number => {
    const { data, width: w, height: h } = img;
    let sum = 0;
    let sq = 0;
    for (let y = 0; y < h; y++) {
      let c = 0;
      const rowBase = y * w;
      for (let x = 0; x < w; x++) if (data[rowBase + x] === 0) c++;
      sum += c;
      sq += c * c;
    }
    const mean = sum / h;
    return sq / h - mean * mean;
  };

  let bestAngle = 0;
  let bestScore = -1;
  for (let a = -8; a <= 8; a += 1) {
    const s = score(rotateGray(thumb, (a * Math.PI) / 180, 255, false));
    if (s > bestScore) {
      bestScore = s;
      bestAngle = a;
    }
  }
  let refined = bestAngle;
  for (let a = bestAngle - 1; a <= bestAngle + 1; a += 0.2) {
    const s = score(rotateGray(thumb, (a * Math.PI) / 180, 255, false));
    if (s > bestScore) {
      bestScore = s;
      refined = a;
    }
  }
  if (Math.abs(refined) < 0.15) return { image: bin, angleDeg: 0 };
  return {
    image: rotateGray(bin, (refined * Math.PI) / 180, 255, false),
    angleDeg: Math.round(refined * 10) / 10,
  };
}

/* ------------------------------------------------------------------ */
/* Scaling + encoding                                                   */
/* ------------------------------------------------------------------ */

/** Box-sample downscale so the longest side is at most `max` px. */
export function downscaleGray(img: GrayImage, max: number): GrayImage {
  const longest = Math.max(img.width, img.height);
  if (longest <= max) return img;
  const scale = max / longest;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const out = new Uint8Array(w * h);
  const fx = img.width / w;
  const fy = img.height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * fy);
    const y1 = Math.min(img.height, Math.max(y0 + 1, Math.floor((y + 1) * fy)));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * fx);
      const x1 = Math.min(img.width, Math.max(x0 + 1, Math.floor((x + 1) * fx)));
      let sum = 0;
      let count = 0;
      for (let yy = y0; yy < y1; yy++) {
        const rowBase = yy * img.width;
        for (let xx = x0; xx < x1; xx++) {
          sum += img.data[rowBase + xx];
          count++;
        }
      }
      out[y * w + x] = Math.round(sum / count);
    }
  }
  return { data: out, width: w, height: h };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Encode grayscale as PNG with colored annotation rectangles drawn in. */
export function encodeAnnotatedPng(
  img: GrayImage,
  overlays: Array<{ rect: Rect; rgb: [number, number, number]; fillAlpha?: number }>,
): Buffer {
  const { width: w, height: h } = img;
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    const v = img.data[i];
    const o = i * 4;
    png.data[o] = v;
    png.data[o + 1] = v;
    png.data[o + 2] = v;
    png.data[o + 3] = 255;
  }
  for (const { rect, rgb, fillAlpha = 0 } of overlays) {
    const x0 = Math.max(0, rect.x);
    const y0 = Math.max(0, rect.y);
    const x1 = Math.min(w - 1, rect.x + rect.w);
    const y1 = Math.min(h - 1, rect.y + rect.h);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const border = y - y0 < 2 || y1 - y < 2 || x - x0 < 2 || x1 - x < 2;
        const o = (y * w + x) * 4;
        if (border) {
          png.data[o] = rgb[0];
          png.data[o + 1] = rgb[1];
          png.data[o + 2] = rgb[2];
        } else if (fillAlpha > 0) {
          png.data[o] = Math.round(png.data[o] * (1 - fillAlpha) + rgb[0] * fillAlpha);
          png.data[o + 1] = Math.round(png.data[o + 1] * (1 - fillAlpha) + rgb[1] * fillAlpha);
          png.data[o + 2] = Math.round(png.data[o + 2] * (1 - fillAlpha) + rgb[2] * fillAlpha);
        }
      }
    }
  }
  return PNG.sync.write(png);
}
