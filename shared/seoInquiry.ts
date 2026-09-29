export interface StandardMetaInput {
  name: string;
  casNumber?: string | null;
  specification?: string | null;
}

function clean(value: string | null | undefined, fallback = "N/A"): string {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

export function buildStandardMeta(input: StandardMetaInput) {
  const name = clean(input.name, "Reference Standard");
  const casNumber = clean(input.casNumber);
  const specification = clean(input.specification);
  return {
    title: `${name} Reference Standard, CAS ${casNumber} | ANPEL - ROWELL`,
    description: `High purity ${name} (CAS: ${casNumber}) analytical reference standard, specification ${specification}. Direct laboratory export by ROWELL. Request a quote.`,
  };
}

export interface InquiryContextInput {
  partNumber?: string | null;
  name?: string | null;
  casNumber?: string | null;
  specification?: string | null;
}

export function buildInquiryContext(input: InquiryContextInput): string {
  const lines = [
    input.partNumber ? `Part number (P/N): ${clean(input.partNumber, "")}` : "",
    input.name ? `Product name: ${clean(input.name, "")}` : "",
    input.casNumber ? `CAS number: ${clean(input.casNumber, "")}` : "",
    input.specification ? `Specification: ${clean(input.specification, "")}` : "",
  ].filter(Boolean);
  return lines.length > 0
    ? `${lines.join("\n")}\n\nQuantity:\nApplication (optional):`
    : "Quantity:\nApplication (optional):";
}
