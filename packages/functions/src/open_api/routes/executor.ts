import { rm } from "node:fs/promises";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Executor } from "@wfa/core/src/entities/executor";
import { Tasks } from "@wfa/core/src/entities/tasks";
import { VFS } from "@wfa/core/src/entities/vfs";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { Resource } from "sst";
import { ensureAuthenticated, getUser } from "../../utils";
import { App, Env } from "../app";
import { AuthorizationHeader } from "../middleware/authentication";

export module ExecutorRoute {
  const code_execution_route = createRoute({
    security: [
      {
        Bearer: [],
      },
    ],
    method: "post",
    path: "/",
    request: {
      params: z.object({
        application_id: Validator.prefixed_cuid2.openapi({
          param: {
            name: "application_id",
            in: "path",
          },
          example: "app_nc6bzmkmd014706rfda898to",
        }),
        workflow_id: Validator.prefixed_cuid2.openapi({
          param: {
            name: "workflow_id",
            in: "path",
          },
          example: "wf_abc123xyz456",
        }),
        steps_id: Validator.prefixed_cuid2.openapi({
          param: {
            name: "steps_id",
            in: "path",
          },
          example: "steps_abc123xyz456",
        }),
        task_id: Validator.prefixed_cuid2.openapi({
          param: {
            name: "task_id",
            in: "path",
          },
          example: "task_abc123xyz456",
        }),
      }),
      headers: z.object({
        authorization: AuthorizationHeader,
      }),
      body: {
        content: {
          "application/json": {
            schema: z.unknown().openapi({
              example: {
                testkev: "testvalue",
              },
            }),
          },
        },
      },
    },
    responses: {
      [StatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z
              .object({
                id: z.string().openapi({
                  example: "task_abc123xyz456",
                }),
                name: z.string().openapi({
                  example: "My Task",
                }),
                token: z.string().openapi({
                  example: "12345678",
                }),
              })
              .openapi("Task"),
          },
        },
        description: "Retrieve a task",
      },
      [StatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z
              .object({
                error: z.string().openapi({
                  example: "Task not found",
                }),
              })
              .openapi("TaskNotFoundError"),
          },
        },
        description: "Task not found",
      },
      [StatusCodes.UNAUTHORIZED]: {
        description: "Unauthorized",
      },
      [StatusCodes.NOT_IMPLEMENTED]: {
        description: "Not implemented",
      },
      [StatusCodes.FAILED_DEPENDENCY]: {
        description: "Failed dependency",
      },
      [StatusCodes.INTERNAL_SERVER_ERROR]: {
        description: "Internal server error",
      },
    },
  });

  export const create = () => {
    const app = new OpenAPIHono<Env>();

    return app.openapi(code_execution_route, async (c) => {
      const params = c.req.valid("param");
      const headers = c.req.valid("header");
      const authed = await ensureAuthenticated(headers.authorization);
      if (!authed.user || !authed.app) {
        return c.json({ error: "Unauthorized" }, StatusCodes.UNAUTHORIZED);
      }
      const task = await Tasks.findById(params.task_id);
      if (!task) {
        return c.json({ error: "Task not found" }, StatusCodes.NOT_FOUND);
      }

      const fromBucket: VFS.From = {
        type: "r2",
        // @ts-ignore
        bucket: Resource.MainCloudflareStorage,
      };

      if (task.custom) {
        return c.json({ error: "Task is custom and cannot be executed" }, StatusCodes.NOT_IMPLEMENTED);
        /*
          try {
            const taskFolder = await Tasks.getEnvironment(task.id, params, fromBucket);
            if (!taskFolder) {
              return c.json({ error: "Task environment failed to load" }, StatusCodes.FAILED_DEPENDENCY);
            }
            const taskScript = await Tasks.loadScript(taskFolder, fromBucket);
            if (!taskScript) {
              return c.json({ error: "Task script failed to load" }, StatusCodes.FAILED_DEPENDENCY);
            }
            const prepared_activity_environment = await Tasks.prepareEnvironment(
              user,
              params,
              taskScript,
              taskFolder,
              !["production", "staging"].includes(Resource.App.stage) ? "local" : Executor.DEFAULT_HOME,
              {
                memory: 4096,
              },
            );
            if (!prepared_activity_environment) {
              return c.json({ error: "Task environment failed to prepare" }, StatusCodes.FAILED_DEPENDENCY);
            }
            const input = c.req.valid("json");
            let result: Executor.ExecutionResult | null = null;
            try {
              result = await Executor.run(prepared_activity_environment, input);
            } catch (error) {
              if (error instanceof Executor.ExecutionError) {
                return c.json({ error: error.message }, StatusCodes.INTERNAL_SERVER_ERROR);
              }
              if (error instanceof Executor.NotImplementetError) {
                return c.json({ error: error.message }, StatusCodes.NOT_IMPLEMENTED);
              }
              return c.json({ error: "Task script failed to execute" }, StatusCodes.INTERNAL_SERVER_ERROR);
            } finally {
              await rm(prepared_activity_environment.environmentPath, { recursive: true });
            }
            if (!result) {
              return c.json({ error: "Task script failed to execute" }, StatusCodes.INTERNAL_SERVER_ERROR);
            }
            return c.json(
              {
                task_id: task.id,
                name: task.name,
                token: task.token,
              },
              StatusCodes.OK,
            );
          } catch (e) {
            console.log(e);
            return c.json({ error: "Task failed to execute" }, StatusCodes.INTERNAL_SERVER_ERROR);
          }
            */
      } else {
        return c.json(
          { error: "Task execution is not implemented yet. We are working on it!" },
          StatusCodes.NOT_IMPLEMENTED,
        );
      }
    });
  };
}
