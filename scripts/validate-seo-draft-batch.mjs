#!/usr/bin/env node
/**
 * Validate an SEO metadata draft batch before Admin SEO Drafts registration.
 * Read-only: never connects to the database, never calls production APIs,
 * and never changes files unless the caller redirects output.
 *
 * Usage:
 *   node scripts/validate-seo-draft-batch.mjs <batch.json>
 *   node scripts/validate-seo-draft-batch.mjs <batch.json> --previous <batch.json>
 */
import fs from "node:fs";
import process from "node:process";
import { URL } from "node:url";

const PROTECTED = new Set([
  "0008541", "186003117", "00d-4723-e0", "00d-4476-an",
  "kinetex-pfp-columns", "c18-columns", "chiral-hplc-columns",
  "hilic-hplc-columns", "gc-columns", "spe-cartridges", "guard-columns",
  "c8-hplc-columns", "phenyl-hplc-columns", "kinetex-hplc-columns",
]);
const PUBLISHED = new Set(["993967-902", "186002353", "00g-4601-e0", "ace-121-1546"]);
const PROHIBITED = [
  /\bprice\b/i, /\bpricing\b/i, /\bstock\b/i, /\binventory\b/i,
  /\bavailability\b/i, /\bavailable\b/i, /\bin stock\b/i,
  /\bships?\b/i, /\bdelivery\b/i, /\blead[- ]?time\b/i,
  /\bofficial(?:ly)?\b/i, /\bauthorized\b/i, /\bauthorised\b/i,
  /\bequivalent\b/i, /\breplacement\b/i, /\bcross[- ]?reference\b/i,
  /\bcompatible\b/i, /\bmanufacturer['’]?s?\s+official\b/i,
];
const COMMERCIAL_FIELDS = new Set([
  "price", "stock", "inventory", "availability", "offers", "offer",
  "delivery", "leadTime", "shipping", "discount", "currency",
]);

function fail(errors, message) { errors.push(message); }
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { throw new Error(`Cannot read JSON ${file}: ${e.message}`); }
}
function text(value) { return typeof value === "string" ? value : ""; }
function norm(value) { return text(value).trim().toLowerCase(); }
function routeSlug(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/products\/([^/]+)\/?$/i);
    return m ? decodeURIComponent(m[1]).toLowerCase() : null;
  } catch { return null; }
}
function scanStrings(value, path = "$") {
  const found = [];
  if (typeof value === "string") {
    for (const re of PROHIBITED) if (re.test(value)) found.push(`${path}: ${JSON.stringify(value)}`);
  } else if (Array.isArray(value)) value.forEach((v, i) => found.push(...scanStrings(v, `${path}[${i}]`)));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) found.push(...scanStrings(v, `${path}.${k}`));
  return found;
}
function findCommercialKeys(value, path = "$") {
  const found = [];
  if (Array.isArray(value)) value.forEach((v, i) => found.push(...findCommercialKeys(v, `${path}[${i}]`)));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (COMMERCIAL_FIELDS.has(k)) found.push(`${path}.${k}`);
      found.push(...findCommercialKeys(v, `${path}.${k}`));
    }
  }
  return found;
}
function validate(batch, label) {
  const errors = [], warnings = [];
  if (!batch || typeof batch !== "object") return [`${label}: root must be an object`];
  if (!text(batch.batchId)) fail(errors, `${label}: missing batchId`);
  if (!Array.isArray(batch.items) || batch.items.length === 0) fail(errors, `${label}: items must be a non-empty array`);
  if (batch.scope && /database|production|publish/i.test(batch.scope) && !/only|draft|review|no .*write/i.test(batch.scope)) warnings.push(`${label}: review scope wording carefully`);
  const ids = new Set(), slugs = new Set(), urls = new Set();
  for (const [i, item] of (batch.items || []).entries()) {
    const p = `${label}.items[${i}]`;
    const slug = norm(item.slug);
    const url = text(item.url);
    const parsedSlug = routeSlug(url);
    if (!slug) fail(errors, `${p}: missing slug`);
    if (item.id !== undefined && item.id !== null) {
      if (ids.has(item.id)) fail(errors, `${p}: duplicate id ${item.id}`); else ids.add(item.id);
    }
    if (slugs.has(slug)) fail(errors, `${p}: duplicate slug ${slug}`); else slugs.add(slug);
    if (urls.has(url)) fail(errors, `${p}: duplicate URL ${url}`); else urls.add(url);
    if (!parsedSlug || parsedSlug !== slug) fail(errors, `${p}: URL must be exactly /products/${slug}; got ${url}`);
    if (!/^https:\/\/www\.rowellhplc\.com\/products\/[^/?#]+$/i.test(url)) fail(errors, `${p}: URL must be canonical www.rowellhplc.com HTTPS product URL`);
    if (PROTECTED.has(slug)) fail(errors, `${p}: protected experiment URL/product is excluded: ${slug}`);
    if (PUBLISHED.has(slug)) fail(errors, `${p}: already published in prior batch: ${slug}`);
    if (item.status && norm(item.status) !== "active") fail(errors, `${p}: status must be active, got ${item.status}`);
    const proposed = item.proposedMeta || {};
    const title = text(proposed.title), description = text(proposed.description);
    if (!title || !description) fail(errors, `${p}: proposedMeta.title and proposedMeta.description are required`);
    if (title.length > 70) fail(errors, `${p}: title length ${title.length} exceeds 70`);
    if (description.length > 160) fail(errors, `${p}: description length ${description.length} exceeds 160`);
    if (title && !/\|\s*ROWELL\s*$/i.test(title)) fail(errors, `${p}: title must end with | ROWELL`);
    if (description && !/\bRFQ\b|request a quote|submit an RFQ/i.test(description)) fail(errors, `${p}: description must contain an RFQ action`);
    if (item.brand && !new RegExp(`\\b${String(item.brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(title + " " + description)) warnings.push(`${p}: brand not visible in proposed metadata`);
    if (item.partNumber && !new RegExp(String(item.partNumber).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(title + " " + description)) warnings.push(`${p}: part number not visible in proposed metadata`);
    if (item.evidence && typeof item.evidence !== "object") fail(errors, `${p}: evidence must be an object`);
    for (const hit of scanStrings(proposed, p + ".proposedMeta")) fail(errors, `prohibited claim ${hit}`);
    for (const hit of findCommercialKeys(item, p)) fail(errors, `commercial field is not allowed ${hit}`);
  }
  for (const hit of scanStrings(batch.qa || {}, `${label}.qa`)) warnings.push(`QA text contains prohibited-term pattern: ${hit}`);
  return { errors, warnings };
}

const args = process.argv.slice(2);
const file = args.find((x) => !x.startsWith("-"));
if (!file) { console.error("Usage: node scripts/validate-seo-draft-batch.mjs <batch.json> [--previous <batch.json>]"); process.exit(2); }
let result;
try {
  const batch = readJson(file);
  result = validate(batch, file);
  const previousAt = args.indexOf("--previous");
  if (previousAt >= 0 && args[previousAt + 1]) {
    const previous = readJson(args[previousAt + 1]);
    const previousSlugs = new Set((previous.items || []).map((x) => norm(x.slug)));
    for (const item of batch.items || []) if (previousSlugs.has(norm(item.slug))) result.errors.push(`duplicate against previous batch: ${item.slug}`);
  }
} catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
console.log(JSON.stringify({ ok: result.errors.length === 0, errors: result.errors, warnings: result.warnings }, null, 2));
process.exit(result.errors.length ? 1 : 0);
