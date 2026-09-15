import "dotenv/config";
import { migrateDatabase } from "../migrate-db";
import { runSeoMetadataDraftPipeline } from "./worker";

async function main(): Promise<void> {
  await migrateDatabase();
  const result = await runSeoMetadataDraftPipeline();
  console.log(`[SeoDraftPipeline] exit status=${result.status} run=${result.runId ?? "none"} drafts=${result.drafts} rejected=${result.rejected}`);
  if (result.status === "failed") process.exitCode = 1;
}

void main().catch(() => {
  // Do not print credentials, raw prompts, raw model output, URLs with query values, or database errors.
  console.error("[SeoDraftPipeline] fatal execution failure");
  process.exitCode = 1;
});
