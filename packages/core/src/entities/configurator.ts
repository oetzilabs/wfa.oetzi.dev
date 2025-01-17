import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { S3Client } from "@aws-sdk/client-s3";
// import { R2Bucket } from "@cloudflare/workers-types";
import {
  custom,
  fallback,
  InferInput,
  InferOutput,
  instance,
  literal,
  number,
  object,
  optional,
  picklist,
  safeParse,
  strictObject,
  string,
  ValiError,
  variant,
} from "valibot";

export module Cfg {
  export const HOMES = ["aws", "cloudflare", "local"] as const;

  export const DEFAULT_HOME: (typeof Cfg.HOMES)[number] = "local";
  export const DEFAULT_MEMORY = 128;
  export const DEFAULT_TIMEOUT = 20_000;
  export const DEFAULT_TASK_RUNNER = {
    memory: DEFAULT_MEMORY,
    timeout: DEFAULT_TIMEOUT,
  };

  const environment_filenames = [".env", ".env.local", ".env.development", ".env.production", ".env.staging"];

  const ConfigSchema = object({
    home: fallback(optional(picklist(Cfg.HOMES)), Cfg.DEFAULT_HOME),
    environment: fallback(optional(picklist(["development", "production", "staging"])), "development"),
    task_runner: fallback(
      optional(
        strictObject({
          memory: fallback(optional(number()), DEFAULT_MEMORY),
          timeout: fallback(optional(number()), DEFAULT_TIMEOUT),
        }),
      ),
      DEFAULT_TASK_RUNNER,
    ),
    storage: variant("type", [
      strictObject({
        type: literal("r2"),
        bucket: custom<R2Bucket>((value) => {
          if (!value) {
            return false;
          }
          if (!(value instanceof R2Bucket)) {
            return false;
          }
          return true;
        }),
      }),
      strictObject({
        type: literal("s3"),
        name: string(),
      }),
      strictObject({
        type: literal("local"),
        bucket: string(),
      }),
    ]),
  });

  export type Config = InferOutput<typeof ConfigSchema>;

  export type Storage =
    | {
        type: "r2";
        bucket: R2Bucket;
      }
    | {
        type: "s3";
        name: string;
        bucket: S3Client;
      }
    | {
        type: "local";
        bucket: string;
      };

  export const findStorage = <
    T extends (typeof ConfigSchema.entries.storage.options)[number]["entries"]["type"]["literal"],
  >(
    type: T,
    bucket: Extract<Storage, { type: T }>["bucket"],
    name: T extends "s3" ? Extract<Storage, { type: "s3" }>["name"] : undefined,
  ): Storage => {
    switch (type) {
      case "r2": {
        return { type: "r2", bucket } as Extract<Storage, { type: "r2" }>;
      }
      case "s3": {
        return { type: "s3", bucket, name } as Extract<Storage, { type: "s3" }>;
      }
      case "local": {
        return { type: "local", bucket: bucket } as Extract<Storage, { type: "local" }>;
      }
      default: {
        throw new Error(`Invalid storage type: ${type}`);
      }
    }
  };

  export const DEFAULT_STORAGE: Storage = findStorage("local", join(process.cwd(), "/tmp"), undefined);

  export abstract class Configurator {
    private static _cfg: Config | undefined = undefined;

    private static check_path(path: string): boolean {
      const isAbsolutePath = path.startsWith("/");
      if (isAbsolutePath) {
        const exists = existsSync(path);
        if (!exists) {
          return false;
        }
      }
      return existsSync(path);
    }

    /**
     * Loads a configuration file from the given path.
     * @param path The path to the configuration file.
     * @returns The configuration object.
     * @example const config = Configurator.load();
     * @example const config = Configurator.load(".env");
     * @example const config = Configurator.load(".env.production");
     * @example const config = Configurator.load(".env", ["SOME_KEY"]);
     * @example const config = Configurator.load({ home: "local", task_runnner_memory: 1024, task_runnner_timeout: 20_000 });
     * @throws {Error} If the configuration file does not exist.
     * @throws {ValiError} If the configuration file/object is invalid.
     */
    public static load(path?: string, ignore_keys: string[] = []): Config {
      if (path === undefined) {
        path = join(process.cwd(), ".env");
      }
      if (path.length === 0) {
        throw new Error("Invalid configuration file path");
      }

      const last_filename_part = path.split("/").pop();

      if (!last_filename_part) {
        throw new Error(`Invalid configuration file name. Expected one of ${environment_filenames.join(", ")}`);
      }

      if (!environment_filenames.includes(last_filename_part)) {
        throw new Error(`Invalid configuration file name. Expected one of ${environment_filenames.join(", ")}`);
      }

      if (!Configurator.check_path(path)) {
        throw new Error(`The configuration file '${path}' does not exist`);
      }

      const env = new Map();

      const lines = readFileSync(path, "utf-8").split("\n");

      for (const line of lines) {
        const [key, value] = line.split("=");
        if (ignore_keys.includes(key)) {
          const replacer = Array.from({ length: value.length }).fill("*").join("");
          console.log(`[CONFIG] ${key}=${replacer} (ignored)`);
          continue;
        }
        // skipping empty lines
        if (!key || !value) {
          continue;
        }
        // skipping comments
        if (key.startsWith("#")) {
          continue;
        }
        // adding empty values as `undefined`, making sure that they are present but not set.
        if (!value) {
          console.log(`[CONFIG] ${key}=${value}`);
          env.set(key, undefined);
          continue;
        }
        const fakeObj = `{"${key}":${value}}`;
        let obj = JSON.parse(fakeObj);
        // cleaning up the object.
        obj = Configurator.cleanObject(obj);

        console.log(`[CONFIG] ${key}=${obj[key]}`);
        env.set(key, JSON.parse(fakeObj)[key]);
      }
      const final_obj: Config = Object.assign({}, ...Array.from(env.values()));

      const is_valid_config = safeParse(ConfigSchema, final_obj);
      if (!is_valid_config.success) {
        throw is_valid_config.issues;
      }
      Configurator._cfg = final_obj;
      return final_obj;
    }
    /**
     * Load a configuration object
     * @param obj your configuration object
     * @returns the configuration object
     */
    public static loadObject(obj: InferInput<typeof ConfigSchema>) {
      const is_valid_config = safeParse(ConfigSchema, obj);
      if (!is_valid_config.success) {
        console.log("Invalid configuration object", is_valid_config.issues);
        throw is_valid_config.issues;
      }
      const storage = findStorage(
        is_valid_config.output.storage.type,
        is_valid_config.output.storage.type === "r2"
          ? is_valid_config.output.storage.bucket
          : is_valid_config.output.storage.type === "s3"
            ? new S3Client({ endpoint: is_valid_config.output.storage.name })
            : is_valid_config.output.storage.bucket,
        is_valid_config.output.storage.type === "s3" ? is_valid_config.output.storage.name : undefined,
      );
      Configurator._cfg = { ...obj, storage };
    }

    public static getConfig(): Config {
      if (!Configurator._cfg) {
        throw new Error("Configurator not initialized");
      }
      return Configurator._cfg;
    }

    /**
     * Gets a value from the configuration.
     * @param key The key of the value to get.
     * @returns The value.
     * @throws {Error} If the configuration is not initialized.
     */
    public static get<K extends keyof Config>(key: K): Config[K] {
      if (!Configurator._cfg) {
        throw new Error("Configurator not initialized yet, please call Configurator.load() first");
      }
      return Configurator._cfg[key];
    }

    private static cleanObject<TO>(obj: TO): TO {
      // there could be possible attack vectors that we have to guard against.
      // such as prototype pollution, object.hasOwnProperty, etc.
      if (typeof obj !== "object" || obj === null) {
        return obj;
      }
      const new_obj = {} as TO;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          new_obj[key] = Configurator.cleanObject(obj[key]);
        }
      }
      return new_obj;
    }
  }
}
