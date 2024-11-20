import { eq } from "drizzle-orm";
import {
  date,
  InferInput,
  intersect,
  nullable,
  optional,
  partial,
  picklist,
  safeParse,
  strictObject,
  string,
} from "valibot";
import { db } from "../drizzle/sql";
import { user_role } from "../drizzle/sql/schema";
import { currency_code, users } from "../drizzle/sql/schemas/users";
import { Validator } from "../validator";

export module Users {
  export const CreateSchema = strictObject({
    name: string(),
    email: Validator.EmailSchema,
    image: optional(nullable(string())),
    verifiedAt: optional(nullable(date())),
    role: optional(picklist(user_role.enumValues)),
  });
  export const UpdateSchema = intersect([partial(Users.CreateSchema), strictObject({ id: Validator.Cuid2Schema })]);

  export type WithOptions = NonNullable<Parameters<typeof db.query.users.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    orgs: {
      with: {
        user: true,
      },
    },
    companies: {
      with: {
        user: true,
      },
    },

    sessions: true,
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Users.findById>>>;

  export const create = async (data: InferInput<typeof Users.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Users.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(users).values(isValid.output).returning();
    const user = await Users.findById(created.id)!;
    return user;
  };

  export const findById = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.users.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...Users._with,
      },
    });
  };

  export const findByEmail = async (_email: string, tsx = db) => {
    const isValid = safeParse(Validator.EmailSchema, _email);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.users.findFirst({
      where: (fields, ops) => ops.eq(fields.email, isValid.output),
      with: {
        ...Users._with,
      },
    });
  };

  export const update = async (data: InferInput<typeof Users.UpdateSchema>, tsx = db) => {
    const isValid = safeParse(Users.UpdateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.update(users).set(isValid.output).where(eq(users.id, isValid.output.id)).returning();
  };

  export const remove = async (id: InferInput<typeof Validator.Cuid2Schema>, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.delete(users).where(eq(users.id, isValid.output)).returning();
  };
}
