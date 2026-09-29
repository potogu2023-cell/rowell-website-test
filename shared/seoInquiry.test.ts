import { describe, expect, it } from "vitest";
import { buildInquiryContext, buildStandardMeta } from "./seoInquiry";

describe("standard SEO metadata", () => {
  it("builds the approved title and description template", () => {
    expect(buildStandardMeta({
      name: "Atenolol",
      casNumber: "29122-68-7",
      specification: "99.0%",
    })).toEqual({
      title: "Atenolol Reference Standard, CAS 29122-68-7 | ANPEL - ROWELL",
      description: "High purity Atenolol (CAS: 29122-68-7) analytical reference standard, specification 99.0%. Direct laboratory export by ROWELL. Request a quote.",
    });
  });

  it("uses safe placeholders when optional values are absent", () => {
    expect(buildStandardMeta({ name: "Example Standard" }).description)
      .toContain("CAS: N/A");
  });
});

describe("inquiry context", () => {
  it("prefills P/N, name, CAS and specification as editable message text", () => {
    expect(buildInquiryContext({
      partNumber: "ANPEL-001",
      name: "Atenolol",
      casNumber: "29122-68-7",
      specification: "99.0%",
    })).toBe([
      "Part number (P/N): ANPEL-001",
      "Product name: Atenolol",
      "CAS number: 29122-68-7",
      "Specification: 99.0%",
      "",
      "Quantity:",
      "Application (optional):",
    ].join("\n"));
  });
});
