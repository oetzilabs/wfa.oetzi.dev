/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "workflowautomation",
      region: "eu-central-1",
      removal: input.stage === "production" ? "retain" : "remove",
      home: "aws",
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
    await import("./stacks/Domain");
    const { mainStorage: storage } = await import("./stacks/Storage");
    // const notification = await import("./stacks/Notification");
    const { realtime, realtimeSubscriber } = await import("./stacks/Realtime");
    const auth = await import("./stacks/Auth");
    const api = await import("./stacks/Api");
    const solidStart = await import("./stacks/SolidStart");
    const { migration: migrate, generate, studio, seed } = await import("./stacks/Database");

    return {
      mainStorageName: storage.name,
      mainStorageArn: storage.arn,
      mainStorageUrn: storage.urn,
      // notificationArn: notification.notifications.arn,
      // notificationUrn: notification.notifications.urn,
      // websocket: websocket.ws.url,
      realtimeUrn: realtime.urn,
      realtimeSubscriber: realtimeSubscriber.urn,

      migrateUrn: migrate.urn,
      generateUrn: generate.urn,
      seedUrn: seed.urn,
      dbStudioUrn: studio.urn,

      authUrl: auth.auth.authenticator.url,
      api: api.hono_api.url,

      solidStartUrl: $dev ? "http://localhost:3000" : solidStart.solidStartApp.url,
    };
  },
});
