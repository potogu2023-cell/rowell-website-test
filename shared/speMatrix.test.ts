import { describe, expect, it } from "vitest";
import { getMatrixSeriesForProduct, getSpeMatrixSeries, slugifyMatrixSeries, SPE_MATRIX_SERIES } from "./speMatrixData";
import { buildMatrixInquiryContext } from "./speMatrix";

describe("SPE matrix data contract", () => {
  it("builds the requested HyperSep C18 route slug", () => {
    expect(slugifyMatrixSeries("HyperSep C18")).toBe("hypersep-c18");
    expect(getSpeMatrixSeries("hypersep-c18")?.variants).toHaveLength(9);
  });

  it("keeps only matrix-eligible series in the shared catalog", () => {
    expect(getSpeMatrixSeries("hypersep-c18")?.skuCount).toBeGreaterThanOrEqual(2);
    expect(getSpeMatrixSeries("agilent-generic-spe-assortment")).toBeUndefined();
  });

  it("exposes exactly the approved series allowlist", () => {
    expect(SPE_MATRIX_SERIES).toHaveLength(15);
    expect(new Set(SPE_MATRIX_SERIES.map((series) => slugifyMatrixSeries(series.seriesName))).size).toBe(15);
    expect(getSpeMatrixSeries("not-a-real-rowell-matrix")).toBeUndefined();
  });

  it("requires slug, brand, and part number for a PDP matrix link", () => {
    expect(getMatrixSeriesForProduct({ slug: "60108-376", brand: "Thermo Fisher", partNumber: "60108-376" })?.seriesName).toBe("HyperSep C18");
    expect(getMatrixSeriesForProduct({ slug: "60108-376", brand: "Other brand", partNumber: "60108-376" })).toBeUndefined();
    expect(getMatrixSeriesForProduct({ slug: "60108-376", brand: "Thermo Fisher", partNumber: "wrong" })).toBeUndefined();
  });

  it("formats selected variants into the RFQ context", () => {
    expect(buildMatrixInquiryContext("HyperSep C18", [
      { partNumber: "60108-376", bedMass: "25 mg", volume: "1 mL", particleSize: "40-60um" },
      { partNumber: "60108-390", bedMass: "50 mg", volume: "1 mL", particleSize: "40-60um" },
    ])).toBe("HyperSep C18 SPE cartridge variants: 60108-376 (25 mg · 1 mL · 40-60um), 60108-390 (50 mg · 1 mL · 40-60um)");
  });
});
