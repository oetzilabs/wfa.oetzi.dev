import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Users } from "@wfa/core/src/entities/users";

const ParamsSchema = z.object({
  id: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: "1212121",
    }),
});

const UserSchema = z
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
  .openapi("User");

const route = createRoute({
  method: "get",
  path: "/users/{id}",
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "Retrieve the user",
    },
    404: {
      description: "User not found",
    },
  },
});
const app = new OpenAPIHono();

app.openapi(route, async (c) => {
  const { id } = c.req.valid("param");
  const user = await Users.findById(id);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({
    id: user.id,
    email: user.email,
    image: user.image,
  });
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1a",
    title: "Open API for Workflow Automation",
  },
});

export default app;
