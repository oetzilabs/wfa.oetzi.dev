import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Organizations } from "@wfa/core/src/entities/organizations";
import { Validator } from "@wfa/core/src/validator";
import { StatusCodes } from "http-status-codes";
import { getApplication, getUser } from "../../utils";
import { Env } from "../app";
import { AuthorizationHeader } from "../middleware/authentication";

export module SessionRoute {
  const app_route = createRoute({
    method: "get",
    path: "/application",
    request: {
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
                id: Validator.prefixed_cuid2.openapi({
                  example: "app_nc6bzmkmd014706rfda898to",
                }),
              })
              .openapi("ApplicationSession"),
          },
        },
        description: "Retrieve an application session",
      },
      [StatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z
              .object({
                error: z.string().openapi({
                  example: "Session for application not found",
                }),
              })
              .openapi("ApplicationSessionNotFoundError"),
          },
        },
        description: "Session for application not found",
      },
      [StatusCodes.UNAUTHORIZED]: {
        description: "Unauthorized",
      },
    },
  });

  const user_route = createRoute({
    method: "get",
    path: "/user",
    request: {
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
                id: Validator.prefixed_cuid2.openapi({
                  example: "user_nc6bzmkmd014706rfda898to",
                }),
                organization_id: z.string().nullable().openapi({
                  example: "org_nc6bzmkmd014706rfda898to",
                }),
                application_id: z.string().nullable().openapi({
                  example: "app_nc6bzmkmd014706rfda898to",
                }),
              })
              .openapi("UserSession"),
          },
        },
        description: "Retrieve an user session",
      },
      [StatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z
              .object({
                error: z.string().openapi({
                  example: "User not found",
                }),
              })
              .openapi("UserSessionNotFoundError"),
          },
        },
        description: "User not found",
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
    app
      .openapi(user_route, async (c) => {
        const cookies = c.req.valid("cookie");

        try {
          const user = await getUser(cookies);
          if (!user) {
            return c.json({ error: "User not found" }, StatusCodes.NOT_FOUND);
          }
          const lastCreatedOrganization = await Organizations.lastCreatedByUserId(user.id);
          const lastCreatedApplication = await Applications.lastCreatedByUserId(user.id);

          return c.json(
            {
              id: user.id,
              organization_id: lastCreatedOrganization?.id ?? null,
              application_id: lastCreatedApplication?.id ?? null,
            },
            StatusCodes.OK,
          );
        } catch (e) {
          console.error("user session error:", e);
          return c.json({ error: "Unauthorized" }, StatusCodes.UNAUTHORIZED);
        }
      })
      .openapi(app_route, async (c) => {
        const cookies = c.req.valid("cookie");

        try {
          const app = await getApplication(cookies);
          if (!app) {
            return c.json({ error: "Application not found" }, StatusCodes.NOT_FOUND);
          }
          return c.json(
            {
              id: app.id,
            },
            StatusCodes.OK,
          );
        } catch (e) {
          console.error("application session error:", e);
          return c.json({ error: "Unauthorized" }, StatusCodes.UNAUTHORIZED);
        }
      });

    return app;
  };
}
