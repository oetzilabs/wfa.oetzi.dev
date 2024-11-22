import { OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Users } from "@wfa/core/src/entities/users";
import { bearerAuth } from "hono/bearer-auth";

const AuthenticationSchema = z.strictObject({
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

export const bearer = bearerAuth({
  prefix: "Bearer",
  headerName: "Autorization",
  verifyToken: async (t, c) => {
    if (!t) return false;
    if (t.length === 0) return false;
    if (!t.includes(":")) return false;

    const splitToken = t.split(":");
    const isValid = AuthenticationSchema.safeParse({ type: splitToken[0], token: splitToken[1] });
    if (!isValid.success) {
      return false;
    }

    const { type, token } = isValid.data;

    switch (type) {
      case "app": {
        const app = await Applications.findByToken(token);
        return !!app;
      }
      case "user": {
        const user = await Users.findBySessionToken(token);
        return user !== undefined;
        // return false;
      }
      default: {
        return false;
      }
    }
  },
});
