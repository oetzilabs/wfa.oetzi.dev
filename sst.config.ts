/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "workflowautomation",
      removal: input.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
      region: "eu-central-1",
      providers: {
        aws: {
          region: "eu-central-1",
        },
        cloudflare: true,
      },
    };
  },
  async run() {
    await import("./stacks/Secrets");
    const { domain } = await import("./stacks/Domain");
    const { mainAWSStorage, mainCloudflareStorage } = await import("./stacks/Storage");

    const { realtime, realtimeSubscriber } = await import("./stacks/Realtime");
    const auth = await import("./stacks/Auth");
    const {
      // hono_open_api_cf,
      hono_open_api_aws,
    } = await import("./stacks/Api");
    const solidStart = await import("./stacks/SolidStart");
    const { migration, generate, studio, seed, dockerstart } = await import("./stacks/Database");

    return {
      mainStorageName: mainAWSStorage.name,
      mainStorageArn: mainAWSStorage.arn,
      mainStorageUrn: mainAWSStorage.urn,

      mainCloudflareStorageName: mainCloudflareStorage.name,
      mainCloudflareStorageUrn: mainCloudflareStorage.urn,

      realtimeUrn: realtime.urn,
      realtimeSubscriber: realtimeSubscriber.urn,

      migrationUrn: migration.urn,
      dockerstartUrn: dockerstart.urn,
      generateUrn: generate.urn,
      seedUrn: seed.urn,
      dbStudioUrn: studio.urn,

      authUrl: auth.auth.authenticator.url,

      open_api: $interpolate`https://api.${domain}`,
      // open_api_worker_url: hono_open_api_cf.url,
      open_api_aws_url: hono_open_api_aws.url,

      solidStartUrl: $dev ? "http://localhost:3000" : solidStart.solidStartApp.url,
    };
  },
});
