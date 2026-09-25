import { describe, expect, it } from "vitest";
import { canonicalUrlForPath, normalizeCanonicalPath } from "./canonical";

describe("canonical URL normalization", () => {
  it("removes query strings, fragments, repeated slashes, and trailing slashes", () => {
    expect(normalizeCanonicalPath("/standards/product/3119113-250mg///?utm_source=gsc#details"))
      .toBe("/standards/product/3119113-250mg");
  });

  it("forces an absolute ROWELL URL onto the canonical public host", () => {
    expect(canonicalUrlForPath("https://rowellhplc.com/learning/example/?ref=test"))
      .toBe("https://www.rowellhplc.com/learning/example");
  });

  it("preserves the root route and encoded route segments", () => {
    expect(canonicalUrlForPath("//")).toBe("https://www.rowellhplc.com/");
    expect(canonicalUrlForPath("/learning/100%25-solvent-guide/?q=ignored"))
      .toBe("https://www.rowellhplc.com/learning/100%25-solvent-guide");
  });
});
