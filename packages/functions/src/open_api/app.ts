import type { LambdaContext, LambdaEvent } from "hono/aws-lambda";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { StatusCodes } from "http-status-codes";
import { onError } from "./errors";
import { ApplicationRoute } from "./routes/applications";
import { DocumentRoute } from "./routes/documents";
import { SessionRoute } from "./routes/session";
import { TestRoute } from "./routes/test";
import { UserRoute } from "./routes/users";

export type Env = {
  Bindings: {
    event: LambdaEvent;
    lambdaContext: LambdaContext;
  };
};

export const createApp = () => {
  let app = new OpenAPIHono<Env>();

  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
  });

  app
    .use(logger(), async (c, next) => {
      c.header("Cache-Control", "no-store");
      return next();
    })
    .notFound((c) => c.json({ message: "Not Found", ok: false }, StatusCodes.NOT_FOUND))
    .route("/test", TestRoute.create())
    .route("/users", UserRoute.create())
    .route("/applications", ApplicationRoute.create())
    .route("/documents", DocumentRoute.create())
    .route("/session", SessionRoute.create())
    .onError(onError);

  app.doc31("/doc", () => ({
    openapi: "3.1.0",
    info: {
      version: "0.0.1a",
      title: "Open API for Workflow Automation",
    },
  }));

  app.get("/ui", swaggerUI({ url: "/doc" }));

  return app;
};

export type App = ReturnType<typeof createApp>;
