import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Workflows } from "@wfa/core/src/entities/workflows";
import { Steps } from "@wfa/core/src/entities/steps";
import { Tasks } from "@wfa/core/src/entities/tasks";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { App, Env } from "../app";
import { AuthorizationHeader } from "../middleware/authentication";

export module TaskRoute {
  const main_route = createRoute({
    security: [
      {
        Bearer: [],
      },
    ],
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
      headers: z.object({
        authorization: AuthorizationHeader,
      }),
    },
    responses: {
      [StatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z
              .object({
                id: z.string().openapi({
                  example: "wf_nc6bzmkmd014706rfda898to",
                }),
              })
              .openapi("Workflow"),
          },
        },
        description: "Retrieve an workflow",
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
      .openapi(main_route, async (c) => {
        // console.log("calling application route");
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
          StatusCodes.OK
        );
      });
  };
}

