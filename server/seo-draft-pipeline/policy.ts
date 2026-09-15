import { z } from "zod";

export const ROWELL_GEMINI_SYSTEM_INSTRUCTION = `You are the ROWELL Chromatography Content & Catalog Governance Assistant.

Mission: help ROWELL present accurate chromatography consumables and reference-standard catalog information in English, build trust through practical technical knowledge, and support RFQ-based inquiry. You are a research, drafting, and QA assistant only. You never publish, edit databases, alter schemas, send messages, contact customers, or assert that content is approved for production.

PRIORITY ORDER: safety and factual boundaries > evidence and risk classification > task routing > output contract > style and length. If rules conflict, obey the higher-priority rule.

NON-NEGOTIABLE PROHIBITIONS:
1. Do not invent or infer price, discount, stock, availability, offer, purchase path, lead time, delivery, shipping, fulfillment, payment, return terms, COA, lot, certification, rating, review, customer case, or any supply commitment.
2. Do not invent technical performance, dimensions, materials, methods, compatibility, recovery, LOD, LOQ, plate count, resolution, validation result, regulated claim, or application result. Use only the input record.
3. Do not state or imply that ROWELL is a manufacturer, official distributor, authorised dealer, affiliate, endorsed party, certified laboratory, or brand representative.
4. Never use or imply equivalent, replacement, compatible with, cross-reference, interchangeable, same as, or similar equivalence language unless exact manufacturer or authoritative one-to-one evidence is in the input. No such evidence is supplied for this job.
5. ROWELL is an RFQ catalogue. Never create Product Offer, price, availability, inventory, delivery, fulfilment, or purchase claims.
6. Do not create content targeted at sales in mainland China. Do not offer regulated, sanctioned, export, end-use, payment, or logistics assurances.

TASK ROUTING: This job is Route A, SKU facts and product metadata draft. The input is an active product record with exact part number, brand, slug, product type, and stored specifications. Treat those supplied values as E1 (verified ROWELL catalogue facts) only. Do not promote them to manufacturer evidence or live commercial facts.

CURRENT VERSIONED CATALOGUE BRAND VOCABULARY: Agilent, Thermo Fisher, Daicel, Phenomenex, Waters, Restek, Shimadzu, Merck, ACE, Avantor, Develosil, Tosoh, YMC. If the input brand is not exactly in this list, return NEEDS_BUSINESS_DECISION and do not draft metadata.

PRODUCT METADATA RULES:
- Preserve brand, exact part number, and the supplied product type verbatim.
- Draft English title target 45-65 characters. Preserve the exact part number; do not truncate it. Add | ROWELL only if it fits the database limit.
- Draft English meta description target 135-160 characters. It may neutrally invite “Request an RFQ” or “Request a Quote” only if the supplied page confirms an RFQ catalogue context.
- The description may describe only supplied record facts. It must not contain price, availability, supply, delivery, shipping, fulfilment, stock, inventory, offer, authorisation, verification, compatibility, replacement, or performance language.
- Do not output internal links, proposed URLs, schema changes, Offer data, images, or changes outside title and meta description.

OUTPUT: Return JSON only, matching the supplied response schema. Every output must use publication_action "draft_only". A draft is eligible only when status is READY_FOR_EDITORIAL_REVIEW and all QA booleans are safe. Otherwise set title and meta_description to null and explain the issue in risks or missing_information.`;

export const SeoDraftStatusSchema = z.enum([
  "READY_FOR_EDITORIAL_REVIEW",
  "EVIDENCE_REQUIRED",
  "NEEDS_BUSINESS_DECISION",
  "BLOCKED_BY_POLICY",
  "NO_ACTION_REQUIRED",
]);

export const SeoDraftResponseSchema = z.object({
  task_id: z.string().min(1).max(128),
  route: z.literal("A"),
  status: SeoDraftStatusSchema,
  language: z.literal("en"),
  scope: z.object({
    brand: z.string().nullable(),
    part_number: z.string().nullable(),
    page_type: z.literal("product"),
  }),
  evidence_summary: z.array(z.object({
    claim: z.string().min(1).max(500),
    evidence_level: z.enum(["E0", "E1", "E2", "E3"]),
    source: z.string().min(1).max(500),
    scope_and_limitations: z.string().min(1).max(1000),
  })).max(10),
  deliverables: z.object({
    title: z.string().nullable(),
    meta_description: z.string().nullable(),
    content_outline: z.array(z.string()).max(0),
    internal_links: z.array(z.string()).max(0),
    required_disclaimers: z.array(z.string()).max(0),
    missing_information: z.array(z.string()).max(20),
    risks: z.array(z.string()).max(20),
  }),
  qa: z.object({
    exact_part_number_preserved: z.boolean(),
    unsupported_equivalence_terms_found: z.boolean(),
    unsupported_commercial_claims_found: z.boolean(),
    identity_claim_risk: z.enum(["none", "review_required"]),
    publication_action: z.literal("draft_only"),
  }),
}).strict();

export type SeoDraftResponse = z.infer<typeof SeoDraftResponseSchema>;

export const GEMINI_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    task_id: { type: "string" },
    route: { type: "string", enum: ["A"] },
    status: {
      type: "string",
      enum: [
        "READY_FOR_EDITORIAL_REVIEW",
        "EVIDENCE_REQUIRED",
        "NEEDS_BUSINESS_DECISION",
        "BLOCKED_BY_POLICY",
        "NO_ACTION_REQUIRED",
      ],
    },
    language: { type: "string", enum: ["en"] },
    scope: {
      type: "object",
      properties: {
        brand: { type: ["string", "null"] },
        part_number: { type: ["string", "null"] },
        page_type: { type: "string", enum: ["product"] },
      },
      required: ["brand", "part_number", "page_type"],
    },
    evidence_summary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          evidence_level: { type: "string", enum: ["E0", "E1", "E2", "E3"] },
          source: { type: "string" },
          scope_and_limitations: { type: "string" },
        },
        required: ["claim", "evidence_level", "source", "scope_and_limitations"],
      },
    },
    deliverables: {
      type: "object",
      properties: {
        title: { type: ["string", "null"] },
        meta_description: { type: ["string", "null"] },
        content_outline: { type: "array", items: { type: "string" }, maxItems: 0 },
        internal_links: { type: "array", items: { type: "string" }, maxItems: 0 },
        required_disclaimers: { type: "array", items: { type: "string" }, maxItems: 0 },
        missing_information: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
      },
      required: [
        "title",
        "meta_description",
        "content_outline",
        "internal_links",
        "required_disclaimers",
        "missing_information",
        "risks",
      ],
    },
    qa: {
      type: "object",
      properties: {
        exact_part_number_preserved: { type: "boolean" },
        unsupported_equivalence_terms_found: { type: "boolean" },
        unsupported_commercial_claims_found: { type: "boolean" },
        identity_claim_risk: { type: "string", enum: ["none", "review_required"] },
        publication_action: { type: "string", enum: ["draft_only"] },
      },
      required: [
        "exact_part_number_preserved",
        "unsupported_equivalence_terms_found",
        "unsupported_commercial_claims_found",
        "identity_claim_risk",
        "publication_action",
      ],
    },
  },
  required: ["task_id", "route", "status", "language", "scope", "evidence_summary", "deliverables", "qa"],
  additionalProperties: false,
} as const;

const UNSUPPORTED_COMMERCIAL_TERMS = [
  "price", "pricing", "quote within", "availability", "available", "in stock", "stock", "inventory",
  "offer", "buy now", "purchase", "checkout", "delivery", "deliver", "shipping", "ship", "fulfillment",
  "fulfilment", "lead time", "fast", "express", "worldwide shipping", "global delivery", "logistics",
  "supply", "supplier", "sourcing", "authorised", "authorized", "official distributor", "verified supply",
];

const UNSUPPORTED_EQUIVALENCE_TERMS = [
  "equivalent", "replacement", "compatible", "cross-reference", "cross reference", "interchangeable", "same as",
];

const UNSUPPORTED_IDENTITY_TERMS = [
  "manufacturer", "official", "authorized dealer", "authorised dealer", "certified", "endorsed", "affiliated",
];

function containsAny(value: string, terms: string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export function validateEditorialDraft(
  draft: SeoDraftResponse,
  expected: { taskId: string; partNumber: string; brand: string },
): { ok: true } | { ok: false; code: string } {
  if (draft.task_id !== expected.taskId || draft.route !== "A" || draft.language !== "en") return { ok: false, code: "identity_mismatch" };
  if (draft.scope.brand !== expected.brand || draft.scope.part_number !== expected.partNumber || draft.scope.page_type !== "product") {
    return { ok: false, code: "scope_mismatch" };
  }
  if (draft.status !== "READY_FOR_EDITORIAL_REVIEW") return { ok: false, code: "not_ready_for_review" };
  if (draft.qa.publication_action !== "draft_only" || !draft.qa.exact_part_number_preserved) return { ok: false, code: "qa_contract_failed" };
  if (draft.qa.unsupported_commercial_claims_found || draft.qa.unsupported_equivalence_terms_found || draft.qa.identity_claim_risk !== "none") {
    return { ok: false, code: "model_flagged_risk" };
  }

  const title = draft.deliverables.title?.trim() ?? "";
  const description = draft.deliverables.meta_description?.trim() ?? "";
  if (!title || !description || title.length > 70 || description.length > 160) return { ok: false, code: "length_or_missing" };
  if (!title.includes(expected.partNumber) || !description.includes(expected.partNumber)) return { ok: false, code: "part_number_not_preserved" };

  const combined = `${title}\n${description}`;
  if (containsAny(combined, UNSUPPORTED_COMMERCIAL_TERMS)) return { ok: false, code: "commercial_claim_detected" };
  if (containsAny(combined, UNSUPPORTED_EQUIVALENCE_TERMS)) return { ok: false, code: "equivalence_claim_detected" };
  if (containsAny(combined, UNSUPPORTED_IDENTITY_TERMS)) return { ok: false, code: "identity_claim_detected" };
  return { ok: true };
}
