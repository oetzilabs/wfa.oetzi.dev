import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import { app } from "./app";
import * as ApplicationRoute from "./routes/applications";
import * as UserRoute from "./routes/users";

console.log(Resource.App.stage);

[UserRoute, ApplicationRoute].forEach((route) => route.registerRoute(app));

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1a",
    title: "Open API for Workflow Automation",
  },
});

export const handler = handle(app);
