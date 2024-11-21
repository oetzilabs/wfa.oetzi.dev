import { OpenAPIHono } from "@hono/zod-openapi";

type Env = {
  Bindings: {};
};

export const app = new OpenAPIHono<Env>();
export type App = typeof app;
