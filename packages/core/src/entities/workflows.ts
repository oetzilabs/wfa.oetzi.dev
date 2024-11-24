import { and, desc, eq } from "drizzle-orm";
import { date, InferInput, intersect, nullable, optional, partial, safeParse, strictObject, string } from "valibot";
import { db } from "../drizzle/sql";
import { workflows_steps } from "../drizzle/sql/schema";
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
    const is_valid_workflow_data = safeParse(Workflows.CreateSchema, data);
    if (!is_valid_workflow_data.success) {
      throw is_valid_workflow_data.issues;
    }
    const [created] = await tsx.insert(workflows).values(is_valid_workflow_data.output).returning();
    const user = await Workflows.findById(created.id)!;
    return user;
  };

  export const findById = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const is_valid_workflow_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_workflow_id.success) {
      throw is_valid_workflow_id.issues;
    }
    return tsx.query.workflows.findFirst({
      where: (fields, ops) => ops.eq(fields.id, is_valid_workflow_id.output),
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
    const is_valid_user_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_user_id.success) throw is_valid_user_id.issues;
    return tsx.query.workflows.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, is_valid_user_id.output),
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
    const is_valid_workflow_data = safeParse(Workflows.UpdateSchema, data);
    if (!is_valid_workflow_data.success) {
      throw is_valid_workflow_data.issues;
    }
    return tsx
      .update(workflows)
      .set(is_valid_workflow_data.output)
      .where(eq(workflows.id, is_valid_workflow_data.output.id))
      .returning();
  };

  export const remove = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const is_valid_workflow_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_workflow_id.success) {
      throw is_valid_workflow_id.issues;
    }
    return update({ id, deletedAt: new Date() }, tsx);
  };

  export const forceDelete = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const is_valid_workflow_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_workflow_id.success) {
      throw is_valid_workflow_id.issues;
    }
    return tsx.delete(workflows).where(eq(workflows.id, is_valid_workflow_id.output)).returning();
  };

  export const lastCreatedByUserId = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const is_valid_workflow_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_workflow_id.success) {
      throw is_valid_workflow_id.issues;
    }
    return tsx
      .select({ id: workflows.id })
      .from(workflows)
      .where(eq(workflows.owner_id, is_valid_workflow_id.output))
      .orderBy(desc(workflows.createdAt))
      .limit(1);
  };

  export const addStep = async (
    id: InferInput<typeof Validator.Cuid2Schema>,
    stepId: InferInput<typeof Validator.Cuid2Schema>,
    tsx = db,
  ) => {
    const is_valid_workflow_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_workflow_id.success) {
      throw is_valid_workflow_id.issues;
    }
    const is_valid_step_id = safeParse(Validator.Cuid2Schema, stepId);
    if (!is_valid_step_id.success) {
      throw is_valid_step_id.issues;
    }
    return tsx
      .insert(workflows_steps)
      .values({ workflow_id: is_valid_workflow_id.output, step_id: is_valid_step_id.output });
  };

  export const removeStep = async (
    id: InferInput<typeof Validator.Cuid2Schema>,
    stepId: InferInput<typeof Validator.Cuid2Schema>,
    tsx = db,
  ) => {
    const is_valid_workflow_id = safeParse(Validator.Cuid2Schema, id);
    if (!is_valid_workflow_id.success) {
      throw is_valid_workflow_id.issues;
    }
    const is_valid_step_id = safeParse(Validator.Cuid2Schema, stepId);
    if (!is_valid_step_id.success) {
      throw is_valid_step_id.issues;
    }
    return tsx
      .delete(workflows_steps)
      .where(
        and(
          eq(workflows_steps.workflow_id, is_valid_workflow_id.output),
          eq(workflows_steps.step_id, is_valid_step_id.output),
        ),
      );
  };
}
