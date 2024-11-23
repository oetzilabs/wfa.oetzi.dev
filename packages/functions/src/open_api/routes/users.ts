import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Users } from "@wfa/core/src/entities/users";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { App, Env } from "../app";
import { AuthorizationHeader } from "../middleware/authentication";

export module UserRoute {
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
          example: "user_nc6bzmkmd014706rfda898to",
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
      [StatusCodes.NOT_FOUND]: {
        description: "User not found",
        content: {
          "application/json": {
            schema: z
              .object({
                error: z.string().openapi({
                  example: "User not found",
                }),
              })
              .openapi("UserNotFoundError"),
          },
        },
      },
      [StatusCodes.UNAUTHORIZED]: {
        description: "Unauthorized",
      },
    },
  });

  export const create = () => {
    const app = new OpenAPIHono<Env>();
    // console.log("registering user route");
    // app.use(main_route.getRoutingPath(), bearer);
    return app.openapi(main_route, async (c) => {
      // console.log("calling user route");
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
}
