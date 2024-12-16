import type { Validator } from "@wfa/core/src/validator";
import type { InferInput } from "valibot";
import { action, json, redirect } from "@solidjs/router";
import { Applications } from "@wfa/core/src/entities/application";
import { Auth } from "../auth";
import { ensureAuthenticated } from "../auth/context";
import { getAuthenticatedSession } from "../auth/util";

export const createApplication = action(
  async (data: Omit<InferInput<typeof Applications.CreateSchema>, "owner_id" | "token">) => {
    "use server";
    const [ctx, event] = await ensureAuthenticated();
    const _data = Object.assign(data, { owner_id: ctx.user.id });
    const app = await Applications.create(_data);
    if (!app) {
      throw new Error("Could not create application");
    }

    const oldSession = ctx.session;

    const session = await Auth.updateSession(oldSession.cookie_token, {
      ...oldSession,
      application_id: app?.id,
    });

    event.context.session = session;

    throw redirect("/dashboard/applications/", {
      revalidate: [getAuthenticatedSession.key],
    });
  },
);

export const chooseApplication = action(async (id: Validator.Cuid2SchemaInput) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const app = await Applications.findById(id);

  if (!app) {
    throw new Error("Application not found");
  }

  if (app.owner?.id !== ctx.user.id) {
    throw new Error("You are not the owner of this application");
  }

  const oldSession = ctx.session;

  const session = await Auth.updateSession(oldSession.cookie_token, {
    ...oldSession,
    application_id: app?.id,
  });

  event.context.session = session;

  throw redirect("/dashboard", {
    revalidate: [getAuthenticatedSession.key],
  });
});

export const joinApplication = action(async (name: string) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const org = await Applications.findByName(name);

  if (!org) {
    throw new Error("Application not found");
  }

  // request to join the organization

  return true;
});

export const removeApplication = action(async (id: Validator.Cuid2SchemaInput) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const app = await Applications.findById(id);

  if (!app) {
    throw new Error("Application not found");
  }

  if (app.owner?.id !== ctx.user.id) {
    throw new Error("You are not the owner of this organization");
  }

  const removed = await Applications.remove(id);

  if (!removed) {
    throw new Error("Failed to remove organization");
  }

  const oldSession = ctx.session;

  const currentApplication = oldSession.application_id;

  const session = await Auth.updateSession(oldSession.cookie_token, {
    ...oldSession,
    application_id: currentApplication && currentApplication === app.id ? null : currentApplication,
  });

  event.context.session = session;
  return json(app, {
    revalidate: [getAuthenticatedSession.key],
  });
});

export const getApplicationById = async (id: Validator.Cuid2SchemaInput) => {
  "use server";
  if (!id) return undefined;
  const [ctx, event] = await ensureAuthenticated();

  const app = await Applications.findById(id);

  if (!app) {
    throw redirect("/404", { status: 404 });
  }
  const is_owner = app.owner.id === ctx.user.id;
  if (!is_owner) {
    throw redirect("/403", { status: 403, statusText: "You are not the owner of this application" });
  }
  return app;
};

export const updateApplication = action(async (data: InferInput<typeof Applications.UpdateSchema>) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const app = await Applications.findById(data.id);

  if (!app) {
    throw new Error("Application not found");
  }

  if (app.owner?.id !== ctx.user.id) {
    throw new Error("You are not the owner of this organization");
  }

  const updated = await Applications.update(data);

  if (!updated) {
    throw new Error("Failed to update organization");
  }

  return json(updated, {
    revalidate: [getAuthenticatedSession.key],
  });
});
