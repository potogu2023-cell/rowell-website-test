// Render's existing Pre-Deploy command points here. Keep the entrypoint stable
// so changing this file and the payloads triggers only the single intended deploy.
import { runStandardsProductsMigration } from "./migrate-standards-products.mjs";

await runStandardsProductsMigration();
