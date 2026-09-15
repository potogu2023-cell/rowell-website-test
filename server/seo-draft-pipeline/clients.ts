import { GoogleAuth } from "google-auth-library";
import {
  GEMINI_RESPONSE_JSON_SCHEMA,
  ROWELL_GEMINI_SYSTEM_INSTRUCTION,
  SeoDraftResponseSchema,
  type SeoDraftResponse,
} from "./policy";

const GSC_READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GSC_ENDPOINT = "https://www.googleapis.com/webmasters/v3";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export type GscQueryRow = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type ServiceAccountCredential = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
  type?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function parseServiceAccount(): ServiceAccountCredential {
  const encoded = requiredEnv("GSC_SERVICE_ACCOUNT_JSON_B64");
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as ServiceAccountCredential;
    if (parsed.type !== "service_account" || !parsed.client_email || !parsed.private_key) {
      throw new Error("invalid_service_account_shape");
    }
    return parsed;
  } catch {
    throw new Error("invalid_gsc_service_account_json_b64");
  }
}

function asFiniteMetric(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function queryFinalGscPageQueryRows(input: {
  startDate: string;
  endDate: string;
  rowLimit: number;
}): Promise<GscQueryRow[]> {
  const siteUrl = requiredEnv("GSC_SITE_URL");
  const credential = parseServiceAccount();
  const auth = new GoogleAuth({ credentials: credential, scopes: [GSC_READONLY_SCOPE] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("gsc_access_token_unavailable");

  const response = await fetch(
    `${GSC_ENDPOINT}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: input.startDate,
        endDate: input.endDate,
        dimensions: ["page", "query"],
        type: "web",
        dataState: "final",
        aggregationType: "auto",
        rowLimit: input.rowLimit,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    const code = response.status;
    throw new Error(`gsc_request_failed_${code}`);
  }

  const payload = await response.json() as {
    rows?: Array<{ keys?: unknown[]; clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown }>;
  };

  return (payload.rows ?? [])
    .map((row) => ({
      page: typeof row.keys?.[0] === "string" ? row.keys[0] : "",
      query: typeof row.keys?.[1] === "string" ? row.keys[1] : "",
      clicks: asFiniteMetric(row.clicks),
      impressions: asFiniteMetric(row.impressions),
      ctr: asFiniteMetric(row.ctr),
      position: asFiniteMetric(row.position),
    }))
    .filter((row) => Boolean(row.page) && Boolean(row.query));
}

export type GeminiProductDraftInput = {
  taskId: string;
  canonicalUrl: string;
  product: {
    id: number;
    slug: string;
    partNumber: string;
    brand: string;
    name: string | null;
    productType: string | null;
    category: string | null;
    usp: string | null;
    phaseType: string | null;
    specifications: unknown;
    currentMetaTitle: string | null;
    currentMetaDescription: string | null;
  };
  searchPerformance: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    startDate: string;
    endDate: string;
  };
};

export async function generateGeminiProductMetadataDraft(input: GeminiProductDraftInput): Promise<SeoDraftResponse> {
  const apiKey = requiredEnv("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const response = await fetch(
    `${GEMINI_ENDPOINT}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ROWELL_GEMINI_SYSTEM_INSTRUCTION }] },
        contents: [{
          role: "user",
          parts: [{
            text: JSON.stringify({
              task_id: input.taskId,
              allowed_action: "Generate a draft title and meta description only. Do not recommend publication.",
              canonical_url: input.canonicalUrl,
              product: input.product,
              search_performance: input.searchPerformance,
              rfq_catalog_context: true,
              evidence_boundary: "Only supplied product fields are verified ROWELL catalogue facts. No manufacturer claims or commercial facts are supplied.",
            }),
          }],
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseJsonSchema: GEMINI_RESPONSE_JSON_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );

  if (!response.ok) {
    throw new Error(`gemini_request_failed_${response.status}`);
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new Error("gemini_empty_response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("gemini_invalid_json");
  }
  return SeoDraftResponseSchema.parse(parsed);
}
