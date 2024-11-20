import { auth } from "./Auth";
import { domain } from "./Domain";
import { allSecrets } from "./Secrets";
import { mainAWSStorage, mainCloudflareStorage } from "./Storage";

const link = [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage];
// const copyFiles = [
//   {
//     from: "packages/core/src/drizzle",
//     to: "drizzle",
//   },
// ];

export const hono_open_api = new sst.cloudflare.Worker("HonoOpenApi", {
  domain: $interpolate`api.${domain}`,
  handler: "packages/functions/src/open_api.handler",
  link,
  url: true,
});
