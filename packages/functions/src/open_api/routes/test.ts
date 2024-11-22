import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
// import { Users } from "@wfa/core/src/entities/tests";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { Env } from "../app";

export module TestRoute {
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
          example: "test_nc6bzmkmd014706rfda898to",
        }),
      }),
    },
    responses: {
      [StatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.boolean(),
                id: Validator.prefixed_cuid2.openapi({
                  example: "test_nc6bzmkmd014706rfda898to",
                }),
              })
              .openapi("Test"),
          },
        },
        description: "Retrieve the test",
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Test not found",
      },
    },
  });

  const main_route_2 = createRoute({
    security: [
      {
        Bearer: [],
      },
    ],
    method: "get",
    path: "/",
    responses: {
      [StatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z
              .object({
                success: z.boolean(),
              })
              .openapi("Test"),
          },
        },
        description: "Retrieve the test",
      },
      [StatusCodes.NOT_FOUND]: {
        description: "Test not found",
      },
    },
  });

  export const create = () => {
    const app = new OpenAPIHono<Env>();
    // console.log("registering test route");
    // app.use(main_route.getRoutingPath(), bearer);
    return app
      .openapi(main_route, async (c) => {
        // console.log("calling test route");
        const { id } = c.req.valid("param");
        // const test = await Users.findById(id);
        // if (!test) {
        //   return c.json({ error: "Test not found" }, 404);
        // }
        return c.json(
          {
            success: true,
            id,
          },
          200,
        );
      })
      .openapi(main_route_2, async (c) => {
        // console.log("calling test route 2");
        return c.json(
          {
            success: true,
          },
          StatusCodes.OK,
        );
      });
  };
}
