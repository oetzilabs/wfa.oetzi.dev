import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Users } from "@wfa/core/src/entities/users";
import { Validator } from "@wfa/core/src/validator";
import { App } from "../app";
import { bearer } from "../middleware/authentication";

const main_route = createRoute({
  method: "get",
  path: "/users/{id}",
  request: {
    params: z.object({
      id: Validator.prefixed_cuid2.openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "user_nc6bzmkmd014706rfda898to",
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
                example: "user_nc6bzmkmd014706rfda898to",
              }),
              email: z.string().openapi({
                example: "user@wfa.oetzi.dev",
              }),
              image: z.string().nullable().openapi({
                example: "https://cdn.wfa.oetzi.dev/images/user.png",
              }),
            })
            .openapi("User"),
        },
      },
      description: "Retrieve the user",
    },
    404: {
      description: "User not found",
    },
  },
});

export const registerRoute = (app: App) => {
  app.use(main_route.getRoutingPath(), bearer);
  return app.openapi(main_route, async (c) => {
    const { id } = c.req.valid("param");
    const user = await Users.findById(id);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(
      {
        id: user.id,
        email: user.email,
        image: user.image,
      },
      200,
    );
  });
};
