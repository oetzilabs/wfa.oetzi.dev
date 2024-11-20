import { auth } from "./Auth";
import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";
import { mainStorage } from "./Storage";

const link = [...allSecrets, auth, mainStorage];
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
