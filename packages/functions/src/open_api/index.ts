import { app } from "./app";
import * as ApplicationRoute from "./routes/applications";
import * as UserRoute from "./routes/users";

[UserRoute, ApplicationRoute].forEach((route) => route.registerRoute(app));

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1a",
    title: "Open API for Workflow Automation",
  },
});

export default {
  fetch: app.fetch,
};
