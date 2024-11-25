import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Workflows } from "@wfa/core/src/entities/workflows";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { App, Env } from "../app";
import { AuthorizationHeader } from "../middleware/authentication";
import { StepRoute } from "./steps";

export module WorkflowRoute {
  const main_route = createRoute({
    security: [
      {
        Bearer: [],
      },
    ],
    method: "get",
    path: "/{wid}",
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
                  examples: ["Workflows not found", "Application not found"],
                }),
              })
              .openapi("ApplicationWorkflowNotFoundError"),
          },
        },
        description: "Application or Workflow not found",
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
        const { wid, aid } = c.req.valid("param");
        const application = await Applications.findById(aid);
        if (!application) {
          return c.json({ error: "Application not found" }, StatusCodes.NOT_FOUND);
        }
        const workflow = await Workflows.findById(wid);
        if (!workflow) {
          return c.json({ error: "Application not found" }, StatusCodes.NOT_FOUND);
        }
        return c.json(
          {
            id: workflow.id,
          },
          StatusCodes.OK
        );
      })
      .route("/{aid}/workflows/{wid}/steps", StepRoute.create());
  };
}
