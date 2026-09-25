export const ROWELL_CANONICAL_ORIGIN = "https://www.rowellhplc.com";

/**
 * Converts a request path or absolute URL into the single indexable ROWELL path.
 * It intentionally removes query strings and fragments, collapses repeated
 * slashes, and removes a trailing slash except at the root. It never decodes
 * route segments, so encoded product and article identifiers remain stable.
 */
export function normalizeCanonicalPath(value: string | undefined | null): string {
  let raw = (value ?? "/").trim();

  try {
    if (/^https?:\/\//i.test(raw)) {
      raw = new URL(raw).pathname;
    }
  } catch {
    // Treat malformed absolute-looking input as a relative path and normalize
    // it below. Canonical tags must still remain on the ROWELL origin.
  }

  raw = raw.split(/[?#]/, 1)[0] || "/";
  if (!raw.startsWith("/")) raw = `/${raw}`;
  raw = raw.replace(/\/{2,}/g, "/");
  if (raw.length > 1) raw = raw.replace(/\/+$/, "");

  return raw || "/";
}

/** Returns an absolute, query-free, single-host canonical URL. */
export function canonicalUrlForPath(value: string | undefined | null): string {
  return `${ROWELL_CANONICAL_ORIGIN}${normalizeCanonicalPath(value)}`;
}
