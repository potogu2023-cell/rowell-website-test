export const UNIVERSAL_COLUMN_PRODUCT_TYPE = "HPLC Column" as const;
export const GC_COLUMN_PRODUCT_TYPE = "GC Column" as const;

export function getPreferredColumnProductTypes(standardCategorySlug?: string | null): string[] {
  // Standards records do not carry a chromatography column type. Keep the
  // default recommendation semantic and stable; future typed mappings can be
  // added here without relying on historical category IDs.
  if (standardCategorySlug?.toLowerCase().includes("gc")) {
    return [GC_COLUMN_PRODUCT_TYPE];
  }
  return [UNIVERSAL_COLUMN_PRODUCT_TYPE];
}

export function recommendedColumnPath(slug?: string | null): string {
  return slug?.trim()
    ? `/products/${encodeURIComponent(slug.trim())}`
    : "/products";
}

export function isUniversalColumnText(text: string | null | undefined): boolean {
  return /\b(?:c\s*-?\s*18|reverse[-\s]?phase|octadecyl)\b/i.test(text || "");
}
