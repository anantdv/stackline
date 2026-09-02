import { describe, expect, it } from "vitest";
import {
  volumetricWeightKg,
  chargeableWeight,
  packLoad,
  ewayBillValidityHours,
  docStatusFromValidity,
  optimizeRoute,
  haversineKm,
  requiredDocsForMethod,
  formatINR,
} from "@contracts/logistics";

describe("volumetricWeightKg", () => {
  it("computes L×W×H/5000 from meter inputs (design-doc example)", () => {
    // 600×400×380 mm → 18.24 kg at divisor 5000
    expect(volumetricWeightKg(0.6, 0.4, 0.38)).toBeCloseTo(18.24, 2);
  });
  it("respects a custom divisor", () => {
    expect(volumetricWeightKg(0.6, 0.4, 0.38, 4000)).toBeCloseTo(22.8, 2);
  });
  it("returns 0 for a non-positive divisor", () => {
    expect(volumetricWeightKg(1, 1, 1, 0)).toBe(0);
  });
});

describe("chargeableWeight", () => {
  it("bills volumetric when higher", () => {
    expect(chargeableWeight(12.4, 18.26)).toEqual({
      chargeableKg: 18.26,
      basis: "volumetric",
    });
  });
  it("bills actual when higher or equal", () => {
    expect(chargeableWeight(20, 18.26)).toEqual({
      chargeableKg: 20,
      basis: "actual",
    });
  });
});

describe("packLoad", () => {
  const truck32 = { lengthM: 9.8, widthM: 2.4, heightM: 2.6, maxWeightKg: 16000 };

  it("packs uniform cartons in a full grid (≈91% utilization)", () => {
    const result = packLoad(truck32, [
      { id: "A", l: 0.44, w: 0.4, h: 0.4, weightKg: 8, qty: 792 },
    ]);
    expect(result.unplaced).toHaveLength(0);
    expect(result.placed).toHaveLength(792);
    expect(result.utilizationPct).toBeGreaterThan(90);
    expect(result.utilizationPct).toBeLessThanOrEqual(100);
  });

  it("never exceeds the cargo space bounds", () => {
    const result = packLoad(truck32, [
      { id: "A", l: 0.6, w: 0.4, h: 0.38, weightKg: 12, qty: 150 },
      { id: "B", l: 0.35, w: 0.25, h: 0.3, weightKg: 6, qty: 60 },
    ]);
    for (const p of result.placed) {
      expect(p.x + p.dx).toBeLessThanOrEqual(truck32.lengthM + 1e-6);
      expect(p.y + p.dy).toBeLessThanOrEqual(truck32.widthM + 1e-6);
      expect(p.z + p.dz).toBeLessThanOrEqual(truck32.heightM + 1e-6);
    }
  });

  it("respects the payload weight cap and reports overweight items", () => {
    const van = { lengthM: 3, widthM: 1.7, heightM: 1.7, maxWeightKg: 50 };
    const result = packLoad(van, [
      { id: "H", l: 0.4, w: 0.4, h: 0.4, weightKg: 20, qty: 5 },
    ]);
    const totalWeight = result.placed.length * 20;
    expect(totalWeight).toBeLessThanOrEqual(50);
    expect(result.unplaced).toEqual([{ id: "H", qty: 3, reason: "overweight" }]);
  });

  it("reports no-fit for items larger than the vehicle", () => {
    const result = packLoad(
      { lengthM: 1, widthM: 1, heightM: 1, maxWeightKg: 1000 },
      [{ id: "X", l: 2, w: 0.5, h: 0.5, weightKg: 5, qty: 1 }],
    );
    expect(result.placed).toHaveLength(0);
    expect(result.unplaced).toEqual([{ id: "X", qty: 1, reason: "no-fit" }]);
  });

  it("handles empty input", () => {
    const result = packLoad(truck32, []);
    expect(result.placed).toHaveLength(0);
    expect(result.utilizationPct).toBe(0);
  });

  it("does not overlap placed boxes", () => {
    const result = packLoad(truck32, [
      { id: "A", l: 0.6, w: 0.5, h: 0.5, weightKg: 10, qty: 40 },
      { id: "B", l: 0.44, w: 0.4, h: 0.4, weightKg: 8, qty: 60 },
    ]);
    const ps = result.placed;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i];
        const b = ps[j];
        const overlap =
          a.x < b.x + b.dx - 1e-9 &&
          b.x < a.x + a.dx - 1e-9 &&
          a.y < b.y + b.dy - 1e-9 &&
          b.y < a.y + a.dy - 1e-9 &&
          a.z < b.z + b.dz - 1e-9 &&
          b.z < a.z + a.dz - 1e-9;
        expect(overlap).toBe(false);
      }
    }
  });
});

describe("ewayBillValidityHours", () => {
  it("100km/day + 1 rule", () => {
    expect(ewayBillValidityHours(0)).toBe(24);
    expect(ewayBillValidityHours(99)).toBe(24);
    expect(ewayBillValidityHours(100)).toBe(48);
    expect(ewayBillValidityHours(250)).toBe(72);
  });
});

describe("docStatusFromValidity", () => {
  const now = new Date("2025-06-01T12:00:00Z");
  it("draft when no validity", () => {
    expect(docStatusFromValidity(null, now)).toBe("draft");
  });
  it("expired when past", () => {
    expect(
      docStatusFromValidity(new Date("2025-06-01T11:00:00Z"), now),
    ).toBe("expired");
  });
  it("expiring within the warning window", () => {
    expect(
      docStatusFromValidity(new Date("2025-06-01T15:00:00Z"), now),
    ).toBe("expiring");
  });
  it("valid beyond the warning window", () => {
    expect(
      docStatusFromValidity(new Date("2025-06-02T12:00:00Z"), now),
    ).toBe("valid");
  });
});

describe("requiredDocsForMethod", () => {
  it("maps shipping methods to statutory doc sets", () => {
    expect(requiredDocsForMethod("road")).toEqual(["IRN", "EWB", "LR"]);
    expect(requiredDocsForMethod("sea")).toEqual(["BOL"]);
    expect(requiredDocsForMethod("air")).toEqual(["AWB"]);
    expect(requiredDocsForMethod("rail")).toEqual(["EWB", "RR"]);
  });
});

describe("haversineKm", () => {
  it("Mumbai → Delhi ≈ 1150 km", () => {
    const km = haversineKm(
      { lat: 19.076, lng: 72.877 },
      { lat: 28.613, lng: 77.209 },
    );
    expect(km).toBeGreaterThan(1100);
    expect(km).toBeLessThan(1200);
  });
  it("same point is 0", () => {
    expect(haversineKm({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0);
  });
});

describe("optimizeRoute", () => {
  const depot = { lat: 19.076, lng: 72.877 };
  const stops = [
    { id: "far-east", lat: 19.29, lng: 73.1 },
    { id: "near", lat: 19.1, lng: 72.9 },
    { id: "mid", lat: 19.2, lng: 73.0 },
    { id: "far-north", lat: 19.4, lng: 72.95 },
  ];

  it("returns all stops and never does worse than input order", () => {
    const naive =
      haversineKm(depot, stops[0]) +
      haversineKm(stops[0], stops[1]) +
      haversineKm(stops[1], stops[2]) +
      haversineKm(stops[2], stops[3]) +
      haversineKm(stops[3], depot);
    const result = optimizeRoute(stops, depot);
    expect(result.orderedStops).toHaveLength(4);
    expect(new Set(result.orderedStops.map((s) => s.id))).toEqual(
      new Set(stops.map((s) => s.id)),
    );
    expect(result.totalKm).toBeLessThanOrEqual(naive + 1e-9);
  });

  it("starts with the nearest stop to the depot", () => {
    const result = optimizeRoute(stops, depot);
    expect(result.orderedStops[0].id).toBe("near");
  });

  it("handles empty and single-stop inputs", () => {
    expect(optimizeRoute([], depot)).toEqual({ orderedStops: [], totalKm: 0 });
    const one = optimizeRoute([stops[1]], depot);
    expect(one.totalKm).toBeCloseTo(haversineKm(depot, stops[1]) * 2, 2);
  });
});

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(184230000)).toBe("₹18,42,300");
    expect(formatINR(50000)).toBe("₹500");
    expect(formatINR(12345678900)).toBe("₹12,34,56,789");
  });
});
