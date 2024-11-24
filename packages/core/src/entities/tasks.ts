import { desc, eq } from "drizzle-orm";
import { date, InferInput, intersect, nullable, optional, partial, safeParse, strictObject, string } from "valibot";
import { db } from "../drizzle/sql";
import { tasks } from "../drizzle/sql/schemas/tasks";
import { Validator } from "../validator";

export module Tasks {
  export const CreateSchema = strictObject({
    name: string(),
    token: optional(string()),
    previous_task_id: optional(nullable(string())),
    owner_id: Validator.Cuid2Schema,
  });

  export const UpdateSchema = intersect([
    partial(Tasks.CreateSchema),
    strictObject({ deletedAt: optional(nullable(date())) }),
    strictObject({ id: Validator.Cuid2Schema }),
  ]);

  export type WithOptions = NonNullable<Parameters<typeof db.query.tasks.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
    used_in: {
      with: {
        step: true,
      },
    },
    previous_task: true,
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Tasks.findById>>>;

  export const create = async (data: InferInput<typeof Tasks.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Tasks.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(tasks).values(isValid.output).returning();
    const user = await Tasks.findById(created.id)!;
    return user;
  };

  export const findById = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.tasks.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...Tasks._with,
      },
    });
  };

  export const findByName = async (name: string, tsx = db) => {
    return tsx.query.tasks.findFirst({
      where: (fields, ops) => ops.eq(fields.name, name),
      with: {
        ...Tasks._with,
        used_in: {
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
    return tsx.query.tasks.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      with: {
        ...Tasks._with,
        used_in: {
          with: {
            step: true,
          },
        },
      },
    });
  };

  export const update = async (data: InferInput<typeof Tasks.UpdateSchema>, tsx = db) => {
    const isValid = safeParse(Tasks.UpdateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.update(tasks).set(isValid.output).where(eq(tasks.id, isValid.output.id)).returning();
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
    return tsx.delete(tasks).where(eq(tasks.id, isValid.output)).returning();
  };

  export const lastCreatedByUserId = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.owner_id, isValid.output))
      .orderBy(desc(tasks.createdAt))
      .limit(1);
  };
}
