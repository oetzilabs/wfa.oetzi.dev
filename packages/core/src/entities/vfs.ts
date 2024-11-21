import type { R2Bucket } from "@cloudflare/workers-types";
import { existsSync, readFileSync } from "node:fs";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import {
  any,
  custom,
  InferOutput,
  lazy,
  literal,
  never,
  number,
  picklist,
  pipe,
  safeParse,
  strictObject,
  string,
  transform,
  ValiError,
} from "valibot";
import { Validator } from "../validator";

export module VFS {
  export type From =
    | {
        type: "r2";
        bucket: R2Bucket;
      }
    | {
        type: "s3";
        bucket: S3Client;
      }
    | {
        type: "classic";
        bucket: string;
      };

  const CheckpointSchema = strictObject({
    fs_type: picklist(["folder", "file"]),
    name: string(),
    schema: any(),
  });

  type Checkpoint = InferOutput<typeof CheckpointSchema>;

  // checkpoints for a given filepath is a valid filepath, that follows the format of `/<version>/<application-id>/files/<file-id>`
  const checkpoints: Checkpoint[] = [
    {
      fs_type: "folder",
      name: "version",
      schema: string(),
    },
    {
      fs_type: "folder",
      name: "application-id",
      schema: Validator.Cuid2Schema,
    },
    {
      fs_type: "folder",
      name: "files",
      schema: literal("files"),
    },
    {
      fs_type: "file",
      name: "file-id",
      schema: Validator.Cuid2Schema,
    },
  ];

  // Function to parse and validate the filepath
  export const parseFilePath = (filepath: string) => {
    // Split the filepath into parts based on '/'
    const parts = filepath.split("/").filter(Boolean);

    // We expect the path to match the structure of <version>/<application-id>/files/<file-id>
    if (parts.length !== checkpoints.length) {
      throw new Error("Invalid filepath structure");
    }

    // Iterate through each checkpoint and validate the corresponding part of the filepath
    checkpoints.forEach((checkpoint, index) => {
      const part = parts[index];
      const { schema } = checkpoint;

      // Validate the part based on the schema
      const isValid = safeParse(schema, part);
      if (!isValid.success) {
        throw isValid.issues;
      }
    });

    return filepath;
  };

  export const getFileAsBuffer = async <F extends From>(filepath: string, from: F) => {
    switch (from.type) {
      case "r2": {
        const file = await from.bucket.get(filepath);
        if (!file) {
          throw new Error(`The file '${filepath}' does not have any contents or does not exist on the R2 Bucket`);
        }
        const array_buffer = await file.arrayBuffer();
        return Buffer.from(array_buffer);
      }
      case "s3": {
        const command = new GetObjectCommand({
          Bucket: Resource.MainAWSStorage.name,
          Key: filepath,
        });
        const response = await from.bucket.send(command);
        if (!response.Body) {
          throw new Error(`The file '${filepath}' does not have any contents or does not exist on the S3 Bucket`);
        }
        const byte_array = await response.Body.transformToByteArray();
        return Buffer.from(byte_array.buffer);
      }
      default: {
        const exists = existsSync(filepath);
        if (!exists) {
          throw new Error(`The file '${filepath}' does not exist on the Storage Path`);
        }
        return readFileSync(filepath);
      }
    }
  };
}
