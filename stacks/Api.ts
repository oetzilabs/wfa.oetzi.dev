import { auth } from "./Auth";
import { cf, domain } from "./Domain";
import { allSecrets } from "./Secrets";
import { mainAWSStorage, mainCloudflareStorage } from "./Storage";

export const hono_open_api_cf = new sst.cloudflare.Worker("HonoOpenApi", {
  domain: $interpolate`api.${domain}`,
  link: [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage],
  handler: "packages/functions/src/open_api/cloudflare.ts",
  url: true,
});

export const hono_open_api_aws = new sst.aws.ApiGatewayV2("HonoOpenApi", {
  link: [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage],
  domain: {
    name: $interpolate`api-aws.${domain}`,
    dns: cf,
  },
});

hono_open_api_aws.route("ANY /{proxy+}", {
  handler: "packages/functions/src/open_api/aws.handler",
  link: [...allSecrets, auth, mainAWSStorage, mainCloudflareStorage],
  url: true,
});
