import { describe, expect, it } from "vitest";
import {
  GC_COLUMN_PRODUCT_TYPE,
  UNIVERSAL_COLUMN_PRODUCT_TYPE,
  getPreferredColumnProductTypes,
  isUniversalColumnText,
  recommendedColumnPath,
} from "./crossLinking";

describe("cross-linking recommendation rules", () => {
  it("defaults standards to universal HPLC columns without category IDs", () => {
    expect(getPreferredColumnProductTypes()).toEqual([UNIVERSAL_COLUMN_PRODUCT_TYPE]);
    expect(getPreferredColumnProductTypes("pharmaceutical")).toEqual([UNIVERSAL_COLUMN_PRODUCT_TYPE]);
  });

  it("supports a semantic GC category when explicitly available", () => {
    expect(getPreferredColumnProductTypes("gc-columns")).toEqual([GC_COLUMN_PRODUCT_TYPE]);
  });

  it("recognizes common universal reverse-phase wording", () => {
    expect(isUniversalColumnText("C18 Reverse-Phase column")).toBe(true);
    expect(isUniversalColumnText("Octadecyl silica")).toBe(true);
    expect(isUniversalColumnText("GC capillary column")).toBe(false);
  });

  it("builds crawlable absolute internal product paths", () => {
    expect(recommendedColumnPath("Acme C18/150")).toBe("/products/Acme%20C18%2F150");
    expect(recommendedColumnPath(null)).toBe("/products");
  });
});
