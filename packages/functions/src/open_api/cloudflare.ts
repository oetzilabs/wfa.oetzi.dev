import { Cfg } from "@wfa/core/src/entities/configurator";
import { Resource } from "sst";
import { createApp } from "./app";

Cfg.Configurator.loadObject({
  home: "cloudflare",
  storage: {
    type: "r2",
    // @ts-ignore
    bucket: Resource.MainCloudflareStorage,
  },
});

const app = createApp();

export default {
  fetch: app.fetch,
};
