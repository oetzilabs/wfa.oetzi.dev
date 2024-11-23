import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { App, Env } from "../app";
import { AuthorizationHeader } from "../middleware/authentication";

export module ApplicationRoute {
  const main_route = createRoute({
    security: [
      {
        Bearer: [],
      },
    ],
    method: "get",
    path: "/{id}",
    request: {
      params: z.object({
        id: Validator.prefixed_cuid2.openapi({
          param: {
            name: "id",
            in: "path",
          },
          example: "app_nc6bzmkmd014706rfda898to",
        }),
      }),
      headers: z.object({
        Authorization: AuthorizationHeader.openapi({
          param: {
            name: "authorization",
            in: "header",
          },
          example: "Bearer <user|app>:<token>",
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
                  example: "app_nc6bzmkmd014706rfda898to",
                }),
              })
              .openapi("Application"),
          },
        },
        description: "Retrieve an application",
      },
      [StatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z
              .object({
                error: z.string().openapi({
                  example: "Application not found",
                }),
              })
              .openapi("ApplicationNotFoundError"),
          },
        },
        description: "Application not found",
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
    return app.openapi(main_route, async (c) => {
      // console.log("calling application route");
      const { id } = c.req.valid("param");
      const app = await Applications.findById(id);
      if (!app) {
        return c.json({ error: "Application not found" }, StatusCodes.NOT_FOUND);
      }
      return c.json(
        {
          id: app.id,
        },
        StatusCodes.OK,
      );
    });
  };
}
