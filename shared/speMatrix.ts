import type { SpeMatrixVariant } from "./speMatrixData";

export function buildMatrixInquiryContext(seriesName: string, variants: Pick<SpeMatrixVariant, "partNumber" | "bedMass" | "volume" | "particleSize">[]) {
  const lines = variants.map((variant) => {
    const specs = [variant.bedMass, variant.volume, variant.particleSize].filter(Boolean).join(" · ");
    return `${variant.partNumber || "P/N pending"}${specs ? ` (${specs})` : ""}`;
  });
  return `${seriesName} SPE cartridge variants: ${lines.join(", ")}`;
}
