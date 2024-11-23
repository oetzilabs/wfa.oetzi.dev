import { desc, eq } from "drizzle-orm";
import { date, InferInput, intersect, nullable, optional, partial, safeParse, strictObject, string } from "valibot";
import { db } from "../drizzle/sql";
import { workflows } from "../drizzle/sql/schemas/workflows";
import { Validator } from "../validator";

export module Workflows {
  export const CreateSchema = strictObject({
    name: string(),
    description: optional(nullable(string())),
    owner_id: Validator.Cuid2Schema,
  });

  export const UpdateSchema = intersect([
    partial(Workflows.CreateSchema),
    strictObject({ deletedAt: optional(nullable(date())) }),
    strictObject({ id: Validator.Cuid2Schema }),
  ]);

  export type WithOptions = NonNullable<Parameters<typeof db.query.workflows.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
    steps: {
      with: {
        step: true,
      },
    },
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Workflows.findById>>>;

  export const create = async (data: InferInput<typeof Workflows.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Workflows.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(workflows).values(isValid.output).returning();
    const user = await Workflows.findById(created.id)!;
    return user;
  };

  export const findById = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.workflows.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...Workflows._with,
      },
    });
  };

  export const findByName = async (name: string, tsx = db) => {
    return tsx.query.workflows.findFirst({
      where: (fields, ops) => ops.eq(fields.name, name),
      with: {
        ...Workflows._with,
        steps: {
          with: {
            step: true,
          },
        },
      },
    });
  };

  export const findByUserId = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.workflows.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      with: {
        ...Workflows._with,
        steps: {
          with: {
            step: true,
          },
        },
      },
    });
  };

  export const update = async (data: InferInput<typeof Workflows.UpdateSchema>, tsx = db) => {
    const isValid = safeParse(Workflows.UpdateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.update(workflows).set(isValid.output).where(eq(workflows.id, isValid.output.id)).returning();
  };

  export const remove = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return update({ id, deletedAt: new Date() }, tsx);
  };

  export const forceDelete = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.delete(workflows).where(eq(workflows.id, isValid.output)).returning();
  };

  export const lastCreatedByUserId = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx
      .select({ id: workflows.id })
      .from(workflows)
      .where(eq(workflows.owner_id, isValid.output))
      .orderBy(desc(workflows.createdAt))
      .limit(1);
  };
}
