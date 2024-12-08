import { desc, eq } from "drizzle-orm";
import {
  any,
  date,
  InferInput,
  intersect,
  nullable,
  number,
  optional,
  partial,
  picklist,
  safeParse,
  strictObject,
  string,
} from "valibot";
import { db } from "../drizzle/sql";
import { activities, activity_logs } from "../drizzle/sql/schemas/activity_logs";
import { Validator } from "../validator";

export module ActivityLogs {
  export const CreateSchema = strictObject({
    previous_activity_log_id: optional(nullable(string())),
    run_by_user_id: Validator.Cuid2Schema,
    application_id: Validator.Cuid2Schema,
    workflow_id: Validator.Cuid2Schema,
    step_id: Validator.Cuid2Schema,
    task_id: Validator.Cuid2Schema,
    status: picklist(activities),
    duration: optional(nullable(number())),
    output: optional(nullable(any())),
  });

  export const UpdateSchema = strictObject({
    id: Validator.Cuid2Schema,
    ...partial(ActivityLogs.CreateSchema).entries,
    ...strictObject({ deletedAt: optional(nullable(date())) }).entries,
  });

  export type WithOptions = NonNullable<Parameters<typeof db.query.activity_logs.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    previous_activity_log: true,
    step: true,
    task: true,
    workflow: true,
    application: true,
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof ActivityLogs.findById>>>;

  export const create = async (data: InferInput<typeof ActivityLogs.CreateSchema>, tsx = db) => {
    const isValid = safeParse(ActivityLogs.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(activity_logs).values(isValid.output).returning();
    const user = await ActivityLogs.findById(created.id)!;
    return user;
  };

  export const findById = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.activity_logs.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...ActivityLogs._with,
      },
    });
  };

  export const findByApplicationId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.activity_logs.findMany({
      where: (fields, ops) => ops.eq(fields.application_id, isValid.output),
      with: {
        ...ActivityLogs._with,
      },
    });
  };

  export const findByWorkflowId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.activity_logs.findMany({
      where: (fields, ops) => ops.eq(fields.workflow_id, isValid.output),
      with: {
        ...ActivityLogs._with,
      },
    });
  };

  export const findByStepId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.activity_logs.findMany({
      where: (fields, ops) => ops.eq(fields.step_id, isValid.output),
      with: {
        ...ActivityLogs._with,
      },
    });
  };

  export const findByTaskId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.activity_logs.findMany({
      where: (fields, ops) => ops.eq(fields.task_id, isValid.output),
      with: {
        ...ActivityLogs._with,
      },
    });
  };

  export const update = async (data: InferInput<typeof ActivityLogs.UpdateSchema>, tsx = db) => {
    const isValid = safeParse(ActivityLogs.UpdateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.update(activity_logs).set(isValid.output).where(eq(activity_logs.id, isValid.output.id)).returning();
  };

  export const remove = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return update({ id, deletedAt: new Date() }, tsx);
  };

  export const forceDelete = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.delete(activity_logs).where(eq(activity_logs.id, isValid.output)).returning();
  };
}
