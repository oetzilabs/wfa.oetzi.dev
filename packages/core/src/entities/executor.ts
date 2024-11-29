import ivm from "isolated-vm";
import { Cfg } from "./configurator";

export module Executor {
  export type ScriptRunner = {
    script: string;
    scriptPath: string;
  };

  export type PreparedEnvironmentOptions = {
    memory: NonNullable<ivm.IsolateOptions["memoryLimit"]>;
    timeout: NonNullable<ivm.RunOptions["timeout"]>;
  };

  export type PreparedEnvironment = {
    id: string;
    environmentPath: string;
    scriptRunner: ScriptRunner;
    home: Cfg.Config["home"];
  } & Partial<PreparedEnvironmentOptions>;

  export const DEFAULT_HOME: PreparedEnvironment["home"] = Cfg.DEFAULT_HOME;

  export const DEFAULT_OPTIONS: PreparedEnvironmentOptions = Cfg.DEFAULT_TASK_RUNNER;

  export type ExecutionResult<T extends unknown = unknown> =
    | {
        type: "completed";
        success: true;
        output: T;
      }
    | {
        type: "completed";
        success: false;
        error: string;
      }
    | {
        type: "preparation";
      };

  export class NotImplementetError extends Error {
    constructor(message: string) {
      super(message);
    }
  }

  export class ExecutionError extends Error {
    constructor(message: string) {
      super(message);
    }
  }

  /**
   * @throws `ExecutionError` if the execution fails
   * @returns `ExecutionResult` if the execution is successful
   */
  export const run = async <I extends unknown>(
    prepared_activity_environment: PreparedEnvironment,
    input: I,
    options = DEFAULT_OPTIONS,
  ): Promise<ExecutionResult> => {
    let result: ExecutionResult = { type: "preparation" };
    const merged_options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    switch (prepared_activity_environment.home) {
      case "aws": {
        throw new NotImplementetError("Not implemented");
        break;
      }
      case "cloudflare": {
        throw new NotImplementetError("Not implemented");
      }
      case "local": {
        // throw new Error("Not implemented");
        try {
          const isolate = new ivm.Isolate({ memoryLimit: merged_options.memory });
          const context = await isolate.createContext();
          const jail = context.global;

          await jail.set("input", input, { copy: true }); // Pass input data

          const customProcess = new Proxy(
            {
              cwd: () => prepared_activity_environment.environmentPath,
              env: {},
            },
            {
              get(target, prop) {
                if (prop in target) {
                  // @ts-ignore
                  return target[prop];
                }
                throw new Error(`Access to process.${prop.toString()} is not allowed`);
              },
            },
          );

          // Inject the custom process object
          await jail.set("process", new ivm.Reference(customProcess), { copy: true });

          const result = await context.eval(prepared_activity_environment.scriptRunner.script, {
            timeout: merged_options.timeout,
            promise: true,
          });
          return result;
        } catch (error) {
          if (error instanceof Error) {
            result = {
              type: "completed",
              success: false,
              error: error.message,
            };
          } else {
            result = {
              type: "completed",
              success: false,
              error: "Unknown error",
            };
          }
        }
        break;
      }
      default: {
        throw new Error("Invalid home");
      }
    }
    return result;
  };
}
