import { auth } from "./Auth";
import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";
import { mainAWSStorage, mainCloudflareStorage } from "./Storage";

const copyFiles = [
  {
    from: "packages/core/src/drizzle",
    to: "drizzle",
  },
];

// export const hono_open_api_cf = new sst.cloudflare.Worker("HonoOpenApi", {
//   domain: $interpolate`api.${domain}`,
//   link: [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage],
//   handler: "packages/functions/src/open_api/cloudflare.ts",
//   dev: $dev,
//   url: true,
// });

export const hono_open_api_aws = new sst.aws.ApiGatewayV2("HonoOpenApiAws", {
  link: [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage],
  domain: {
    name: $interpolate`api-aws.${domain}`,
    dns: cf,
  },
});

hono_open_api_aws.route("$default", {
  handler: "packages/functions/src/open_api/aws.handler",
  link: [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage],
  url: true,
  copyFiles,
  nodejs: {
    install: ["isolated-vm", "pg"],
  },
  runtime: "nodejs22.x",
});
