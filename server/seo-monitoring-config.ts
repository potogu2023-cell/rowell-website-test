export type SeoMonitorTarget = {
  key: string;
  url: string;
  expectedSchema: "Product" | "CollectionPage";
  requiresImage: boolean;
};

// These are the exact, publicly resolvable URLs in the active experiment register.
// Changes require a reviewed code change, so the monitored scope stays auditable.
export const DEFAULT_SEO_MONITOR_TARGETS: readonly SeoMonitorTarget[] = [
  { key: "CTR-01", url: "https://www.rowellhplc.com/products/00d-4723-e0", expectedSchema: "Product", requiresImage: true },
  { key: "CTR-02", url: "https://www.rowellhplc.com/products/0008541", expectedSchema: "Product", requiresImage: true },
  { key: "CTR-03", url: "https://www.rowellhplc.com/products/00d-4476-an", expectedSchema: "Product", requiresImage: true },
  { key: "CTR-04", url: "https://www.rowellhplc.com/products/186003117", expectedSchema: "Product", requiresImage: true },
  { key: "CTR-05", url: "https://www.rowellhplc.com/categories/kinetex-pfp-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-01", url: "https://www.rowellhplc.com/categories/c18-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-02", url: "https://www.rowellhplc.com/categories/chiral-hplc-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-03", url: "https://www.rowellhplc.com/categories/hilic-hplc-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-04", url: "https://www.rowellhplc.com/categories/gc-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-05", url: "https://www.rowellhplc.com/categories/spe-cartridges", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-06", url: "https://www.rowellhplc.com/categories/guard-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-07", url: "https://www.rowellhplc.com/categories/c8-hplc-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-08", url: "https://www.rowellhplc.com/categories/phenyl-hplc-columns", expectedSchema: "CollectionPage", requiresImage: false },
  { key: "RANK-09", url: "https://www.rowellhplc.com/categories/kinetex-hplc-columns", expectedSchema: "CollectionPage", requiresImage: false },
] as const;

function boundedInteger(rawValue: string | undefined, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(rawValue || "", 10);
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

export const SEO_MONITORING_CONFIG = {
  enabled: process.env.SEO_MONITOR_ENABLED === "true",
  // A completed run is required before the next one can start. This prevents a
  // deployment restart from increasing the monitoring frequency.
  intervalHours: boundedInteger(process.env.SEO_MONITOR_INTERVAL_HOURS, 24, 6, 168),
  // Alerting begins only after the same public check fails in two consecutive runs.
  consecutiveFailureThreshold: boundedInteger(process.env.SEO_MONITOR_FAILURE_THRESHOLD, 2, 2, 5),
  targets: DEFAULT_SEO_MONITOR_TARGETS,
} as const;

export type SeoMonitoringConfig = typeof SEO_MONITORING_CONFIG;
