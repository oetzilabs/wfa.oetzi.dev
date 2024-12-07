import { desc, eq } from "drizzle-orm";
import {
  array,
  date,
  InferInput,
  intersect,
  nullable,
  optional,
  partial,
  pipe,
  safeParse,
  strictObject,
  string,
  transform,
} from "valibot";
import { db } from "../drizzle/sql";
import { organizations } from "../drizzle/sql/schema";
import { Validator } from "../validator";

export module Organizations {
  export const CreateSchema = strictObject({
    owner_id: Validator.Cuid2Schema,
    name: string(),
    email: string(),
    phoneNumber: optional(nullable(string())),
    website: optional(string()),
    image: optional(string()),

    base_charge: optional(
      nullable(
        pipe(
          Validator.MinZeroSchema,
          transform((val) => String(val)),
        ),
      ),
    ),
    distance_charge: optional(
      nullable(
        pipe(
          Validator.MinZeroSchema,
          transform((val) => String(val)),
        ),
      ),
    ),
    time_charge: optional(
      nullable(
        pipe(
          Validator.MinZeroSchema,
          transform((val) => String(val)),
        ),
      ),
    ),
  });

  export const UpdateSchema = intersect([
    partial(Organizations.CreateSchema),
    strictObject({ deletedAt: optional(nullable(date())) }),
    strictObject({ id: Validator.Cuid2Schema }),
  ]);

  export type WithOptions = NonNullable<Parameters<typeof db.query.organizations.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Organizations.findById>>>;

  export const create = async (data: InferInput<typeof Organizations.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Organizations.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(organizations).values(isValid.output).returning();
    const org = await Organizations.findById(created.id);
    return org!;
  };

  export const findById = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid) throw new Error("Invalid id");
    return tsx.query.organizations.findFirst({
      where: (fields, ops) => ops.eq(fields.id, id),
      with: {
        ...Organizations._with,
        employees: {
          with: { user: true },
        },
      },
    });
  };

  export const findByName = async (name: string, tsx = db) => {
    return tsx.query.organizations.findFirst({
      where: (fields, ops) => ops.eq(fields.name, name),
      with: {
        ...Organizations._with,
        employees: {
          with: { user: true },
        },
      },
    });
  };

  export const findByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.organizations.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      with: {
        ...Organizations._with,
        employees: {
          with: { user: true },
        },
      },
    });
  };

  export const lastCreatedByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.organizations.findFirst({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      orderBy: [desc(organizations.createdAt)],
      with: {
        ...Organizations._with,
        employees: {
          with: { user: true },
        },
      },
    });
  };

  export const update = async (data: InferInput<typeof UpdateSchema>, tsx = db) => {
    const isValid = safeParse(Organizations.UpdateSchema, data);
    if (!isValid.success) throw isValid.issues;
    return tsx.update(organizations).set(isValid.output).where(eq(organizations.id, isValid.output.id)).returning();
  };

  export const remove = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return update({ id, deletedAt: new Date() }, tsx);
  };

  export const forceDelete = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.delete(organizations).where(eq(organizations.id, isValid.output)).returning();
  };
  export const seed = async (data: InferInput<typeof CreateSchema>[] = []) => {
    const created = [];
    if (data.length > 0) {
      const is_valid_data = safeParse(array(CreateSchema), data);
      if (!is_valid_data.success) {
        throw is_valid_data.issues;
      }
      for (const org of data) {
        const orgExists = await Organizations.findByName(org.name);
        if (!orgExists) {
          const createdOrg = await Organizations.create(org);
          if (!createdOrg) {
            throw new Error("Could not create organization");
          }
          console.log(`Organization ${createdOrg.name} created`);
          created.push(createdOrg);
        }
      }
    }
  };
}
