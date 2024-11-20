import { auth } from "./Auth";
import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";
import { mainStorage } from "./Storage";

const link = [...allSecrets, auth, mainStorage];

export const api = new sst.aws.ApiGatewayV2("Api", {
  domain: {
    name: $interpolate`api.${domain}`,
    dns: cf,
  },
  cors: {
    allowOrigins: ["*"],
  },
  link,
});

const copyFiles = [
  {
    from: "packages/core/src/drizzle",
    to: "drizzle",
  },
];

api.route("GET /session", {
  handler: "packages/functions/src/session.handler",
  link,
  copyFiles,
});
