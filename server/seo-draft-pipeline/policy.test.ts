import { describe, expect, it } from "vitest";
import { validateEditorialDraft, type SeoDraftResponse } from "./policy";

const expected = { taskId: "seo-draft-1-101", brand: "Waters", partNumber: "186002350" };

function safeDraft(): SeoDraftResponse {
  return {
    task_id: expected.taskId,
    route: "A",
    status: "READY_FOR_EDITORIAL_REVIEW",
    language: "en",
    scope: { brand: expected.brand, part_number: expected.partNumber, page_type: "product" },
    evidence_summary: [{
      claim: "Brand, exact part number and product type are from the verified ROWELL catalogue record.",
      evidence_level: "E1",
      source: "ROWELL verified product record",
      scope_and_limitations: "This evidence does not establish manufacturer status, commercial availability, or performance claims.",
    }],
    deliverables: {
      title: "Waters 186002350 Chromatography Column | ROWELL",
      meta_description: "Review verified catalog details for Waters 186002350 chromatography column and request an RFQ from ROWELL for product information.",
      content_outline: [],
      internal_links: [],
      required_disclaimers: [],
      missing_information: [],
      risks: [],
    },
    qa: {
      exact_part_number_preserved: true,
      unsupported_equivalence_terms_found: false,
      unsupported_commercial_claims_found: false,
      identity_claim_risk: "none",
      publication_action: "draft_only",
    },
  };
}

describe("ROWELL SEO draft policy", () => {
  it("accepts a bounded draft-only metadata proposal", () => {
    expect(validateEditorialDraft(safeDraft(), expected)).toEqual({ ok: true });
  });

  it("rejects availability language even if model QA claims it is safe", () => {
    const draft = safeDraft();
    draft.deliverables.meta_description = "Check availability for Waters 186002350 chromatography column and request an RFQ from ROWELL.";
    expect(validateEditorialDraft(draft, expected)).toEqual({ ok: false, code: "commercial_claim_detected" });
  });

  it("rejects unsupported replacement language", () => {
    const draft = safeDraft();
    draft.deliverables.meta_description = "Review Waters 186002350 as a replacement chromatography column and request an RFQ from ROWELL.";
    expect(validateEditorialDraft(draft, expected)).toEqual({ ok: false, code: "equivalence_claim_detected" });
  });
});
