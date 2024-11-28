import type { R2Bucket } from "@cloudflare/workers-types";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GetObjectCommand, ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";
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
import { Cfg } from "./configurator";

export module VFS {
  export type VFSFile<P extends string> = {
    type: "file";
    path: P;
    contents: Buffer;
  };

  export type VFSFolder<P extends string, CP extends string = string> = {
    type: "folder";
    path: P;
    contents: (VFSFile<CP> | VFSFolder<CP>)[];
  };

  const createFolder = <P extends string>(path: P): VFSFolder<P> => {
    return {
      type: "folder",
      path,
      contents: [],
    };
  };

  const createFile = <P extends string>(path: P, contents: Buffer): VFSFile<P> => {
    return {
      type: "file",
      path,
      contents,
    };
  };

  const CheckpointSchema = strictObject({
    fs_type: picklist(["folder", "file"]),
    name: string(),
    schema: any(),
  });

  type Checkpoint = InferOutput<typeof CheckpointSchema>;

  // checkpoints for a given filepath is a valid filepath, that follows the format of `/<version>/<application-id>/files/<file-id>`
  const file_checkpoints: Checkpoint[] = [
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

  const task_folder_checkpoints: Checkpoint[] = [
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
      name: "workflow-id",
      schema: Validator.Cuid2Schema,
    },
    {
      fs_type: "folder",
      name: "steps",
      schema: literal("tasks"),
    },
    {
      fs_type: "folder",
      name: "step-id",
      schema: Validator.Cuid2Schema,
    },
    {
      fs_type: "folder",
      name: "tasks",
      schema: literal("tasks"),
    },
    {
      fs_type: "folder",
      name: "task-id",
      schema: Validator.Cuid2Schema,
    },
  ];

  // Function to parse and validate the filepath
  export const parseFilePath = (filepath: string) => {
    // Split the filepath into parts based on '/'
    const parts = filepath.split("/").filter(Boolean);

    // We expect the path to match the structure of <version>/<application-id>/files/<file-id>
    if (parts.length !== file_checkpoints.length) {
      throw new Error("Invalid filepath structure");
    }

    // Iterate through each checkpoint and validate the corresponding part of the filepath
    file_checkpoints.forEach((checkpoint, index) => {
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

  export const getFileAsBuffer = async (filepath: string, from: Cfg.Storage) => {
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
          Bucket: from.name,
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

  export const parseFolderPath = (filepath: string) => {
    // Split the filepath into parts based on '/'
    const parts = filepath.split("/").filter(Boolean);

    // We expect the path to match the structure of <version>/<application-id>/files/<file-id>
    if (parts.length !== task_folder_checkpoints.length) {
      throw new Error("Invalid filepath structure");
    }

    // Iterate through each checkpoint and validate the corresponding part of the filepath
    task_folder_checkpoints.forEach((checkpoint, index) => {
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

  export const getFolder = async <P extends string>(path: P, from: Cfg.Storage): Promise<VFSFolder<P>> => {
    switch (from.type) {
      case "r2": {
        const folder: VFSFolder<P> = {
          type: "folder",
          path,
          contents: [],
        };
        // get the folder contents
        const files = await from.bucket.list({ prefix: path });
        for (const file of files.objects) {
          const fileContents = await from.bucket.get(file.key);
          if (!fileContents) {
            console.error(`The file '${file.key}' does not have any contents or does not exist on the R2 Bucket`);
            continue;
          }
          if (file.key.endsWith("/")) {
            folder.contents.push(createFolder(file.key));
            continue;
          }
          const array_buffer = await fileContents.arrayBuffer();
          folder.contents.push(createFile(file.key, Buffer.from(array_buffer)));
        }
        return folder;
      }
      case "s3": {
        const folder: VFSFolder<P> = {
          type: "folder",
          path,
          contents: [],
        };
        // get the folder contents
        const listObjectsCommand = new ListObjectsCommand({
          Bucket: from.name,
          Prefix: path,
        });
        const files = await from.bucket.send(listObjectsCommand);
        if (!files.Contents) {
          throw new Error(`The folder '${path}' does not have any contents or does not exist on the S3 Bucket`);
        }
        for (const file of files.Contents) {
          if (!file.Key) {
            console.error(`The file '${file.Key}' does not have any contents or does not exist on the S3 Bucket`);
            continue;
          }
          if (file.Key.endsWith("/")) {
            folder.contents.push(createFolder(file.Key));
            continue;
          }
          const array_buffer = await from.bucket.send(
            new GetObjectCommand({
              Bucket: from.name,
              Key: file.Key,
            }),
          );
          const body = array_buffer.Body;
          if (!body) {
            console.error(`The file '${file.Key}' does not have any contents or does not exist on the S3 Bucket`);
            continue;
          }
          const buffer = await body.transformToByteArray();
          folder.contents.push(createFile(file.Key, Buffer.from(buffer)));
        }
      }
      default: {
        const exists = existsSync(path);
        if (!exists) {
          throw new Error(`The folder '${path}' does not exist on the Storage Path`);
        }
        const folder: VFSFolder<P> = {
          type: "folder",
          path,
          contents: [],
        };
        // get the folder contents
        const files = readdirSync(path);
        for (const file of files) {
          if (file.endsWith("/")) {
            folder.contents.push(createFolder(file));
            continue;
          }
          const filePath = join(path, file);
          const array_buffer = readFileSync(filePath);
          folder.contents.push(createFile(file, Buffer.from(array_buffer)));
        }
        return folder;
      }
    }
  };
  export const exists = async <P extends string>(path: P, from: VFSFolder<P>): Promise<boolean> => {
    let _exists = false;
    if (from.type === "folder") {
      if (from.contents.length === 0) {
        _exists = false;
        return _exists;
      }
    }
    for (const content of from.contents) {
      if (content.type === "folder") {
        _exists = await exists(path, content);
        if (_exists) {
          break;
        }
      }
      if (content.path === path) {
        _exists = true;
        break;
      }
    }
    return _exists;
  };
}
