import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fallback, InferOutput, number, object, optional, picklist, safeParse } from "valibot";

export module Cfg {
  export const HOMES = ["aws", "cloudflare", "local"] as const;

  export const DEFAULT_HOME: (typeof Cfg.HOMES)[number] = "local";
  export const DEFAULT_MEMORY = 128;
  export const DEFAULT_TIMEOUT = 20_000;

  const environment_filenames = [".env", ".env.local", ".env.development", ".env.production"];

  export const ConfigSchema = object({
    home: fallback(optional(picklist(Cfg.HOMES)), Cfg.DEFAULT_HOME),
    task_runnner_memory: fallback(optional(number()), DEFAULT_MEMORY),
    task_runnner_timeout: fallback(optional(number()), DEFAULT_TIMEOUT),
  });

  export type Config = InferOutput<typeof ConfigSchema>;

  export abstract class Configurator {
    static _cfg: Config | undefined = undefined;

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
     * @throws {Error} If the configuration file does not exist.
     */
    public static load<T extends Config>(path?: string, ignore_keys: string[] = []): T {
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
      const final_obj: T = Object.assign({}, ...Array.from(env.values()));

      const is_valid_config = safeParse(Cfg.ConfigSchema, final_obj);
      if (!is_valid_config.success) {
        throw is_valid_config.issues;
      }
      Configurator._cfg = final_obj;
      return final_obj;
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
    public get<K extends keyof Config>(key: K): Config[K] {
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
