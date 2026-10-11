import { describe, expect, it } from "vitest";
import { getSpeMatrixSeries, slugifyMatrixSeries } from "./speMatrixData";
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

  it("formats selected variants into the RFQ context", () => {
    expect(buildMatrixInquiryContext("HyperSep C18", [
      { partNumber: "60108-376", bedMass: "25 mg", volume: "1 mL", particleSize: "40-60um" },
      { partNumber: "60108-390", bedMass: "50 mg", volume: "1 mL", particleSize: "40-60um" },
    ])).toBe("HyperSep C18 SPE cartridge variants: 60108-376 (25 mg · 1 mL · 40-60um), 60108-390 (50 mg · 1 mL · 40-60um)");
  });
});
