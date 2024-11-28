import { S3Client } from "@aws-sdk/client-s3";
import { Cfg } from "@wfa/core/src/entities/configurator";
import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import { createApp } from "./app";

const bucket = new S3Client({
  endpoint: Resource.MainAWSStorage.name,
});

Cfg.Configurator.loadObject({
  home: "aws",
  storage: {
    type: "s3",
    name: Resource.MainAWSStorage.name,
    // @ts-expect-error
    bucket,
  },
});

export const handler = handle(createApp());
