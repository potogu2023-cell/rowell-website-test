import "dotenv/config";
import { runCredentialConnectivityProbe } from "./probe";

void runCredentialConnectivityProbe().then((passed) => {
  if (!passed) process.exitCode = 1;
}).catch(() => {
  // Keep credential, response, and endpoint details out of logs.
  console.error("[SeoDraftProbe] fatal execution failure");
  process.exitCode = 1;
});
