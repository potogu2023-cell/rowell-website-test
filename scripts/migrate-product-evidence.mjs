import { runStandardsProductsMigration } from "./migrate-standards-products.mjs";

// Render Pre-Deploy entrypoint for this batch is standards-only.
// The legacy products migration is archived and is not executed.
await runStandardsProductsMigration();
