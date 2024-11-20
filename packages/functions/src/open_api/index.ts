import { OpenAPIHono } from "@hono/zod-openapi";
import * as Applications from "./applications";
import * as Users from "./users";

const app = new OpenAPIHono();

[Users, Applications].forEach((route) => route.registerRoute(app));

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1a",
    title: "Open API for Workflow Automation",
  },
});

export default app;
