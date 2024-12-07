import type { Validator } from "@wfa/core/src/validator";
import type { InferInput } from "valibot";
import { action, json, redirect } from "@solidjs/router";
import { Organizations } from "@wfa/core/src/entities/organizations";
import { Auth } from "../auth";
import { ensureAuthenticated } from "../auth/context";
import { getAuthenticatedSession } from "../auth/util";

export const createOrganization = action(
  async (data: Omit<InferInput<typeof Organizations.CreateSchema>, "owner_id">) => {
    "use server";
    const [ctx, event] = await ensureAuthenticated();
    const _data = Object.assign(data, { owner_id: ctx.user.id });
    const org = await Organizations.create(_data);

    const oldSession = ctx.session;

    const session = await Auth.updateSession(oldSession.cookie_token, {
      ...oldSession,
      organization_id: org.id,
    });

    event.context.session = session;

    throw redirect("/dashboard/organizations/" + org.id, {
      revalidate: [getAuthenticatedSession.key],
    });
  },
);

export const joinOrganization = action(async (name: string) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const org = await Organizations.findByName(name);

  if (!org) {
    throw new Error("Organization not found");
  }

  // request to join the organization

  return true;
});

export const removeOrganization = action(async (id: Validator.Cuid2SchemaInput) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const org = await Organizations.findById(id);

  if (!org) {
    throw new Error("Organization not found");
  }

  if (org.owner?.id !== ctx.user.id) {
    throw new Error("You are not the owner of this organization");
  }

  const removed = await Organizations.remove(id);

  if (!removed) {
    throw new Error("Failed to remove organization");
  }

  const oldSession = ctx.session;

  const session = await Auth.updateSession(oldSession.cookie_token, {
    ...oldSession,
    organization_id: null,
  });

  event.context.session = session;

  throw redirect("/dashboard", {
    revalidate: [getAuthenticatedSession.key],
  });
});

export const getOrganizationById = async (id: Validator.Cuid2SchemaInput) => {
  "use server";
  if (!id) return undefined;
  const [ctx, event] = await ensureAuthenticated();

  const org = await Organizations.findById(id);

  if (!org) {
    throw redirect("/404", { status: 404 });
  }
  return org;
};

export const updateOrganization = action(async (data: InferInput<typeof Organizations.UpdateSchema>) => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  const org = await Organizations.findById(data.id);

  if (!org) {
    throw new Error("Organization not found");
  }

  if (org.owner?.id !== ctx.user.id) {
    throw new Error("You are not the owner of this organization");
  }

  const updated = await Organizations.update(data);

  if (!updated) {
    throw new Error("Failed to update organization");
  }

  return json(updated, {
    revalidate: [getAuthenticatedSession.key],
  });
});
