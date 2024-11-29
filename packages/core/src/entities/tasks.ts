import type { Executor } from "./executor";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { date, InferInput, intersect, nullable, optional, partial, safeParse, strictObject, string } from "valibot";
import { db } from "../drizzle/sql";
import { tasks } from "../drizzle/sql/schemas/tasks";
import { Validator } from "../validator";
import { ActivityLogs } from "./activity_logs";
import { Cfg } from "./configurator";
import { Downloader } from "./downloader";
import { Users } from "./users";
import { VFS } from "./vfs";

export module Tasks {
  export const CreateSchema = strictObject({
    name: string(),
    token: optional(string()),
    previous_task_id: optional(nullable(string())),
    owner_id: Validator.Cuid2Schema,
  });

  export const UpdateSchema = intersect([
    partial(Tasks.CreateSchema),
    strictObject({ deletedAt: optional(nullable(date())) }),
    strictObject({ id: Validator.Cuid2Schema }),
  ]);

  export type WithOptions = NonNullable<Parameters<typeof db.query.tasks.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
    used_in: {
      with: {
        step: true,
      },
    },
    previous_task: true,
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Tasks.findById>>>;

  export const create = async (data: InferInput<typeof Tasks.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Tasks.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(tasks).values(isValid.output).returning();
    const user = await Tasks.findById(created.id)!;
    return user;
  };

  export const findById = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.tasks.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...Tasks._with,
      },
    });
  };

  export const findByName = async (name: string, tsx = db) => {
    return tsx.query.tasks.findFirst({
      where: (fields, ops) => ops.eq(fields.name, name),
      with: {
        ...Tasks._with,
        used_in: {
          with: {
            step: true,
          },
        },
      },
    });
  };

  export const findByUserId = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.tasks.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      with: {
        ...Tasks._with,
        used_in: {
          with: {
            step: true,
          },
        },
      },
    });
  };

  export const update = async (data: InferInput<typeof Tasks.UpdateSchema>, tsx = db) => {
    const isValid = safeParse(Tasks.UpdateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.update(tasks).set(isValid.output).where(eq(tasks.id, isValid.output.id)).returning();
  };

  export const remove = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return update({ id, deletedAt: new Date() }, tsx);
  };

  export const forceDelete = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.delete(tasks).where(eq(tasks.id, isValid.output)).returning();
  };

  export const lastCreatedByUserId = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.owner_id, isValid.output))
      .orderBy(desc(tasks.createdAt))
      .limit(1);
  };

  export const EnvironmentSchema = strictObject({
    application_id: Validator.Cuid2Schema,
    workflow_id: Validator.Cuid2Schema,
    steps_id: Validator.Cuid2Schema,
    task_id: Validator.Cuid2Schema,
    previous: optional(Validator.Cuid2Schema),
  });

  export const getEnvironment = async (
    taskId: InferInput<typeof Validator.Cuid2Schema>,
    environment: InferInput<typeof EnvironmentSchema>,
    from: Cfg.Storage,
    tsx = db,
  ) => {
    const is_valid_task_id = safeParse(Validator.Cuid2Schema, taskId);
    if (!is_valid_task_id.success) {
      throw is_valid_task_id.issues;
    }
    const is_valid_environment = safeParse(EnvironmentSchema, environment);
    if (!is_valid_environment.success) {
      throw is_valid_environment.issues;
    }
    const task = await Tasks.findById(is_valid_task_id.output, tsx);
    if (!task) {
      throw new Error("Task not found");
    }
    const path = [environment.application_id, environment.workflow_id, environment.steps_id, environment.task_id].join(
      "/",
    );
    return Downloader.getFolder(`v0.0.1/${path}`, from);
  };

  export const loadScript = async (
    env: Awaited<ReturnType<typeof Tasks.getEnvironment>>,
    from: Cfg.Storage,
  ): Promise<Executor.ScriptRunner> => {
    let script: string = "";
    const scriptPath = "/scripts/main.js";
    const hasScriptPath = await VFS.exists(scriptPath, env);
    if (!hasScriptPath) {
      throw new Error("Script not found");
    }
    const scriptFile = await VFS.getFileAsBuffer(scriptPath, from);
    if (!scriptFile) {
      throw new Error("Script not found");
    }
    script = scriptFile.toString();
    return {
      script,
      scriptPath,
    };
  };

  export const prepareEnvironment = async <SR extends Executor.ScriptRunner>(
    user: Users.Info,
    environment: InferInput<typeof EnvironmentSchema>,
    scriptRunner: SR,
    taskFolder: Awaited<ReturnType<typeof VFS.getFolder>>,
    home: Executor.PreparedEnvironment["home"] = Cfg.DEFAULT_HOME,
    options: Partial<Executor.PreparedEnvironmentOptions> = Cfg.DEFAULT_TASK_RUNNER,
  ): Promise<Executor.PreparedEnvironment> => {
    const activity_log = await ActivityLogs.create({
      run_by_user_id: user.id,
      application_id: environment.application_id,
      workflow_id: environment.workflow_id,
      step_id: environment.steps_id,
      task_id: environment.task_id,
      previous_activity_log_id: environment.previous,
      status: "preparing_environment",
    });

    if (!activity_log) throw new Error("Could not create environment, activity log could not be created");
    const script = scriptRunner.script;
    const scriptPath = scriptRunner.scriptPath;
    // make a folder for the environemnt to live in
    const environmentPath = path.join("tmp", `/environments/${activity_log.id}`);

    try {
      await mkdir(environmentPath, { recursive: true });
      // copy the files to the folder
      await copyFiles(environmentPath, taskFolder, [
        {
          path: scriptPath,
        },
      ]);
    } catch (e) {
      throw new Error("Could not create environment, could not create folder");
    }

    return {
      id: activity_log.id,
      environmentPath,
      scriptRunner,
      home,
      memory: options.memory,
      timeout: options.timeout,
    };
  };

  const copyFiles = async <P extends string, IP extends { path: string }>(
    environmentPath: string,
    folder: VFS.VFSFolder<P>,
    ignorePaths: IP[] = [],
  ) => {
    for (const entity of folder.contents) {
      if (entity.type === "file" && ignorePaths.some((ignorePath) => entity.path.startsWith(ignorePath.path))) {
        continue;
      }
      try {
        if (entity.type === "folder") {
          await mkdir(environmentPath + entity.path, { recursive: true });
          await copyFiles(environmentPath + entity.path, entity);
          continue;
        }
        await writeFile(environmentPath + entity.path, entity.contents);
      } catch (e) {
        throw new Error("Could not create environment, could not copy files");
      }
    }
  };
}
