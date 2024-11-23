import { OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Users } from "@wfa/core/src/entities/users";
import { bearerAuth } from "hono/bearer-auth";

export const AuthenticationSchema = z.strictObject({
  type: z.enum(["app", "user"]),
  token: z.string(),
});

export const AuthorizationHeader = z.string().openapi({
  param: {
    name: "authorization",
    in: "header",
    required: true,
  },
});
