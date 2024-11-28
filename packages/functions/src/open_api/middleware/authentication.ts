import { z } from "@hono/zod-openapi";

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
