import { auth } from "./Auth";
import { domain } from "./Domain";
import { allSecrets } from "./Secrets";
import { mainAWSStorage, mainCloudflareStorage } from "./Storage";

export const hono_open_api = new sst.cloudflare.Worker("HonoOpenApi", {
  domain: $interpolate`api.${domain}`,
  link: [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage],
  handler: "packages/functions/src/open_api/index.ts",
  url: true,
});
