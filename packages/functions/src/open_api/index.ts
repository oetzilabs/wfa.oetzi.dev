import { OpenAPIHono, z } from "@hono/zod-openapi";
import { Applications } from "@wfa/core/src/entities/application";
import { Users } from "@wfa/core/src/entities/users";
import { bearerAuth } from "hono/bearer-auth";
import * as ApplicationRoute from "./applications";
import * as UserRoute from "./users";

const app = new OpenAPIHono();

const AuthenticationSchema = z.strictObject({
  type: z.enum(["app", "user"]),
  token: z.string(),
});

app.use(
  "*",
  bearerAuth({
    prefix: "Bearer",
    verifyToken: async (t, c) => {
      if(t.length === 0) return false;
      if(!t.includes(":")) return false;

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
  })
);

[UserRoute, ApplicationRoute].forEach((route) => route.registerRoute(app));

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1a",
    title: "Open API for Workflow Automation",
  },
});

export default app;
