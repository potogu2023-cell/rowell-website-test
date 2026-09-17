import { probeGeminiStructuredOutput, queryFinalGscPageQueryRows } from "./clients";

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function boundedErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown";
  const safe = message.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 64);
  return safe || "unknown";
}

/**
 * Verifies only external credentials and endpoint access.
 *
 * This module must never import the database client, migration runner, product schema,
 * editorial worker, customer data, or any write-capable code. It does one final-data
 * GSC request with rowLimit=1 and one schema-only Gemini generation request. It logs
 * only a bounded outcome code and a row count, never secrets, queries, URLs, prompts,
 * product facts, or model output.
 */
export async function runCredentialConnectivityProbe(): Promise<boolean> {
  // Keep the same final-data semantics as the scheduled worker without retrieving its
  // candidate set. A three-day holdback avoids potentially incomplete Search Console data.
  const endDate = isoDate(addUtcDays(new Date(), -3));
  const startDate = isoDate(addUtcDays(new Date(), -30));
  let passed = true;

  try {
    const rows = await queryFinalGscPageQueryRows({ startDate, endDate, rowLimit: 1 });
    console.log(`[SeoDraftProbe] gsc=ok rows_returned=${rows.length}`);
  } catch (error) {
    passed = false;
    console.error(`[SeoDraftProbe] gsc=failed code=${boundedErrorCode(error)}`);
  }

  try {
    await probeGeminiStructuredOutput();
    console.log("[SeoDraftProbe] gemini=ok");
  } catch (error) {
    passed = false;
    console.error(`[SeoDraftProbe] gemini=failed code=${boundedErrorCode(error)}`);
  }

  console.log(`[SeoDraftProbe] exit status=${passed ? "passed" : "failed"}`);
  return passed;
}
