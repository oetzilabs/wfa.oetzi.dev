import { eq } from "drizzle-orm";
import { date, InferInput, intersect, nullable, optional, partial, safeParse, strictObject, string } from "valibot";
import { db } from "../drizzle/sql";
import { applications } from "../drizzle/sql/schemas/applications";
import { Validator } from "../validator";

export module Applications {
  export const CreateSchema = strictObject({
    name: string(),
    token: string(),
    owner_id: Validator.Cuid2Schema,
  });

  export const UpdateSchema = intersect([
    partial(Applications.CreateSchema),
    strictObject({ deletedAt: optional(nullable(date())) }),
    strictObject({ id: Validator.Cuid2Schema }),
  ]);

  export type WithOptions = NonNullable<Parameters<typeof db.query.applications.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Applications.findById>>>;

  export const create = async (data: InferInput<typeof Applications.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Applications.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(applications).values(isValid.output).returning();
    const user = await Applications.findById(created.id)!;
    return user;
  };

  export const findById = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.applications.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...Applications._with,
      },
    });
  };

  export const findByToken = async (token: string, tsx = db) => {
    return tsx.query.applications.findFirst({
      where: (fields, ops) => ops.eq(fields.token, token),
      with: {
        ...Applications._with,
      },
    });
  };

  export const findByName = async (name: string, tsx = db) => {
    return tsx.query.applications.findFirst({
      where: (fields, ops) => ops.eq(fields.name, name),
      with: {
        ...Applications._with,
      },
    });
  };

  export const findByUserId = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.applications.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      with: {
        ...Applications._with,
      },
    });
  };

  export const update = async (data: InferInput<typeof Applications.UpdateSchema>, tsx = db) => {
    const isValid = safeParse(Applications.UpdateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.update(applications).set(isValid.output).where(eq(applications.id, isValid.output.id)).returning();
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
    return tsx.delete(applications).where(eq(applications.id, isValid.output)).returning();
  };
}
