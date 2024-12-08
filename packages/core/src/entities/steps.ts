import { and, desc, eq } from "drizzle-orm";
import { date, InferInput, intersect, nullable, optional, partial, safeParse, strictObject, string } from "valibot";
import { db } from "../drizzle/sql";
import { steps_tasks } from "../drizzle/sql/schema";
import { steps } from "../drizzle/sql/schemas/steps";
import { Validator } from "../validator";

export module Steps {
  export const CreateSchema = strictObject({
    name: string(),
    token: optional(string()),
    previous_step_id: optional(nullable(string())),
    owner_id: Validator.Cuid2Schema,
  });

  export const UpdateSchema = strictObject({
    id: Validator.Cuid2Schema,
    ...strictObject({ deletedAt: optional(nullable(date())) }).entries,
    ...partial(Steps.CreateSchema).entries,
  });

  export type WithOptions = NonNullable<Parameters<typeof db.query.steps.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
    used_in: {
      with: {
        step: true,
      },
    },
    previous_step: true,
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Steps.findById>>>;

  export const create = async (data: InferInput<typeof Steps.CreateSchema>, tsx = db) => {
    const is_valid_step_data = safeParse(Steps.CreateSchema, data);
    if (!is_valid_step_data.success) {
      throw is_valid_step_data.issues;
    }
    const [created] = await tsx.insert(steps).values(is_valid_step_data.output).returning();
    const user = await Steps.findById(created.id)!;
    return user;
  };

  export const findById = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const is_valid_step_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_step_id.success) {
      throw is_valid_step_id.issues;
    }
    return tsx.query.steps.findFirst({
      where: (fields, ops) => ops.eq(fields.id, is_valid_step_id.output),
      with: {
        ...Steps._with,
      },
    });
  };

  export const findByName = async (name: string, tsx = db) => {
    return tsx.query.steps.findFirst({
      where: (fields, ops) => ops.eq(fields.name, name),
      with: {
        ...Steps._with,
        used_in: {
          with: {
            step: true,
          },
        },
      },
    });
  };

  export const findByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const is_valid_user_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_user_id.success) throw is_valid_user_id.issues;
    return tsx.query.steps.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, is_valid_user_id.output),
      with: {
        ...Steps._with,
        used_in: {
          with: {
            step: true,
          },
        },
      },
    });
  };

  export const update = async (data: InferInput<typeof Steps.UpdateSchema>, tsx = db) => {
    const is_valid_step_data = safeParse(Steps.UpdateSchema, data);
    if (!is_valid_step_data.success) {
      throw is_valid_step_data.issues;
    }
    return tsx
      .update(steps)
      .set(is_valid_step_data.output)
      .where(eq(steps.id, is_valid_step_data.output.id))
      .returning();
  };

  export const remove = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const is_valid_step_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_step_id.success) {
      throw is_valid_step_id.issues;
    }
    return update({ id, deletedAt: new Date() }, tsx);
  };

  export const forceDelete = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const is_valid_step_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_step_id.success) {
      throw is_valid_step_id.issues;
    }
    return tsx.delete(steps).where(eq(steps.id, is_valid_step_id.output)).returning();
  };

  export const lastCreatedByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const is_valid_user_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_user_id.success) {
      throw is_valid_user_id.issues;
    }
    return tsx
      .select({ id: steps.id })
      .from(steps)
      .where(eq(steps.owner_id, is_valid_user_id.output))
      .orderBy(desc(steps.createdAt))
      .limit(1);
  };

  export const addTask = async (id: Validator.Cuid2SchemaInput, taskId: Validator.Cuid2SchemaInput, tsx = db) => {
    const is_valid_step_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_step_id.success) {
      throw is_valid_step_id.issues;
    }
    const is_valid_task_id = safeParse(Validator.Cuid2Schema, taskId);
    if (!is_valid_task_id.success) {
      throw is_valid_task_id.issues;
    }
    return tsx.insert(steps_tasks).values({ step_id: is_valid_step_id.output, task_id: is_valid_task_id.output });
  };

  export const removeTask = async (id: Validator.Cuid2SchemaInput, taskId: Validator.Cuid2SchemaInput, tsx = db) => {
    const is_valid_step_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_step_id.success) {
      throw is_valid_step_id.issues;
    }
    const is_valid_task_id = safeParse(Validator.Cuid2Schema, taskId);
    if (!is_valid_task_id.success) {
      throw is_valid_task_id.issues;
    }
    return tsx
      .delete(steps_tasks)
      .where(and(eq(steps_tasks.step_id, is_valid_step_id.output), eq(steps_tasks.task_id, is_valid_task_id.output)));
  };
}
