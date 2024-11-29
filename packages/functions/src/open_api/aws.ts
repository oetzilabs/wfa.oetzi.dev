import { Cfg } from "@wfa/core/src/entities/configurator";
import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import { createApp } from "./app";

Cfg.Configurator.loadObject({
  home: "aws",
  environment:
    Resource.App.stage === "production" ? "production" : Resource.App.stage === "staging" ? "staging" : "development",
  storage: {
    type: "s3",
    name: Resource.MainAWSStorage.name,
  },
});

const app = createApp();

export const handler = handle(app);
