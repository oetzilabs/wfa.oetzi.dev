import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Validator } from "@wfa/core/src/validator";

const main_route = createRoute({
  method: "get",
  path: "/applications/{id}",
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
  },
  responses: {
    200: {
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
    404: {
      content: {
        "application/json": {
          schema: z
            .object({
              error: z.string().openapi({
                example: "Application not found",
              }),
            })
            .openapi("Error"),
        },
      },
      description: "Application not found",
    },
  },
});

export const registerRoute = (app: OpenAPIHono) => {
  return app.openapi(main_route, async (c) => {
    const { id } = c.req.valid("param");
    const app = await Applications.findById(id);
    if (!app) {
      return c.json({ error: "Application not found" }, 404);
    }
    return c.json(
      {
        id: app.id,
      },
      200,
    );
  });
};
