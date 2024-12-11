import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Steps } from "@wfa/core/src/entities/steps";
import { Tasks } from "@wfa/core/src/entities/tasks";
import { Workflows } from "@wfa/core/src/entities/workflows";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { ensureAuthenticated } from "src/utils";
import { Env } from "../app";
import { AuthorizationHeader } from "../middleware/authentication";
import { ExecutorRoute } from "./executor";

export module TaskRoute {
  const list_tasks = createRoute({
    method: "get",
    path: "/",
    request: {
      params: z.object({
        aid: Validator.prefixed_cuid2.openapi({
          param: {
            name: "aid",
            in: "path",
          },
          example: "app_nc6bzmkmd014706rfda898to",
        }),
        wid: Validator.prefixed_cuid2.openapi({
          param: {
            name: "wid",
            in: "path",
          },
          example: "wf_nc6bzmkmd014706rfda898to",
        }),
        sid: Validator.prefixed_cuid2.openapi({
          param: {
            name: "sid",
            in: "path",
          },
          example: "step_nc6bzmkmd014706rfda898to",
        }),
      }),
      cookies: z.object({
        access_token: z.string().openapi({
          param: {
            name: "access_token",
            in: "cookie",
          },
          example: "12345678",
        }),
        refresh_token: z.string().openapi({
          param: {
            name: "refresh_token",
            in: "cookie",
          },
          example: "12345678",
        }),
      }),
    },
    responses: {
      [StatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z
              .object({
                id: z.string().openapi({
                  example: "task_nc6bzmkmd014706rfda898to",
                }),
              })
              .array()
              .openapi("TaskList"),
          },
        },
        description: "Retrieve a list of tasks",
      },
      [StatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z
              .object({
                error: z.string().openapi({
                  examples: ["Workflows not found", "Application not found", "Step not found"],
                }),
              })
              .openapi("ApplicationWorkflowStepTaskNotFoundError"),
          },
        },
        description: "Application, Workflow or Step not found",
      },
      [StatusCodes.UNAUTHORIZED]: {
        description: "Unauthorized",
      },
    },
  });

  const main_route = createRoute({
    method: "get",
    path: "/{tid}",
    request: {
      params: z.object({
        aid: Validator.prefixed_cuid2.openapi({
          param: {
            name: "aid",
            in: "path",
          },
          example: "app_nc6bzmkmd014706rfda898to",
        }),
        wid: Validator.prefixed_cuid2.openapi({
          param: {
            name: "wid",
            in: "path",
          },
          example: "wf_nc6bzmkmd014706rfda898to",
        }),
        sid: Validator.prefixed_cuid2.openapi({
          param: {
            name: "sid",
            in: "path",
          },
          example: "step_nc6bzmkmd014706rfda898to",
        }),
        tid: Validator.prefixed_cuid2.openapi({
          param: {
            name: "tid",
            in: "path",
          },
          example: "task_nc6bzmkmd014706rfda898to",
        }),
      }),
      cookies: z.object({
        access_token: z.string().openapi({
          param: {
            name: "access_token",
            in: "cookie",
          },
          example: "12345678",
        }),
        refresh_token: z.string().openapi({
          param: {
            name: "refresh_token",
            in: "cookie",
          },
          example: "12345678",
        }),
      }),
    },
    responses: {
      [StatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z
              .object({
                id: z.string().openapi({
                  example: "task_nc6bzmkmd014706rfda898to",
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
                  examples: ["Workflows not found", "Application not found", "Step not found", "Task not found"],
                }),
              })
              .openapi("ApplicationWorkflowStepTaskNotFoundError"),
          },
        },
        description: "Application, Workflow, Step or Task not found",
      },
      [StatusCodes.UNAUTHORIZED]: {
        description: "Unauthorized",
      },
    },
  });

  export const create = () => {
    const app = new OpenAPIHono<Env>();
    // console.log("registering application route");
    // app.use(main_route.getRoutingPath(), bearer);
    return app
      .openapi(list_tasks, async (c) => {
        const cookies = c.req.valid("cookie");
        const authenticated = await ensureAuthenticated(cookies);

        if (!authenticated) {
          return c.json({ error: "Unauthorized" }, StatusCodes.UNAUTHORIZED);
        }

        const params = c.req.valid("param");

        const application = await Applications.findById(params.aid);
        if (!application) {
          return c.json({ error: "Application not found" }, StatusCodes.NOT_FOUND);
        }

        const workflow = await Workflows.findById(params.wid);
        if (!workflow) {
          return c.json({ error: "Workflow not found" }, StatusCodes.NOT_FOUND);
        }

        const step = await Steps.findById(params.sid);
        if (!step) {
          return c.json({ error: "Step not found" }, StatusCodes.NOT_FOUND);
        }

        const tasks = await Tasks.findByStepId(step.id);

        if (!tasks) {
          return c.json({ error: "Tasks not found" }, StatusCodes.NOT_FOUND);
        }

        return c.json(
          tasks.map((t) => ({ id: t.id })),
          StatusCodes.OK,
        );
      })
      .openapi(main_route, async (c) => {
        const cookies = c.req.valid("cookie");
        const authenticated = await ensureAuthenticated(cookies);

        if (!authenticated) {
          return c.json({ error: "Unauthorized" }, StatusCodes.UNAUTHORIZED);
        }

        const params = c.req.valid("param");

        const application = await Applications.findById(params.aid);
        if (!application) {
          return c.json({ error: "Application not found" }, StatusCodes.NOT_FOUND);
        }
        const workflow = await Workflows.findById(params.wid);
        if (!workflow) {
          return c.json({ error: "Workflow not found" }, StatusCodes.NOT_FOUND);
        }
        const step = await Steps.findById(params.sid);
        if (!step) {
          return c.json({ error: "Step not found" }, StatusCodes.NOT_FOUND);
        }
        const task = await Tasks.findById(params.tid);
        if (!task) {
          return c.json({ error: "Task not found" }, StatusCodes.NOT_FOUND);
        }
        return c.json(
          {
            id: task.id,
          },
          StatusCodes.OK,
        );
      })
      .route("/{tid}/run", ExecutorRoute.create());
  };
}
