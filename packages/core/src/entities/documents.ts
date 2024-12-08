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
import { document_statuses, documents } from "../drizzle/sql/schemas/documents";
import { Validator } from "../validator";
import { Applications } from "./application";
import { Users } from "./users";

export module Documents {
  export const CreateSchema = strictObject({
    app_id: Validator.Cuid2Schema,
    owner_id: Validator.Cuid2Schema,
    filename: string(),
    folder_id: Validator.Cuid2Schema,
    filepath: string(),
    hash: optional(string()),
    status: optional(picklist(document_statuses)),
  });

  export const UpdateSchema = strictObject({
    id: Validator.Cuid2Schema,
    ...strictObject({ deletedAt: optional(nullable(date())) }).entries,
    ...partial(Documents.CreateSchema).entries,
  });

  export type WithOptions = NonNullable<Parameters<typeof db.query.documents.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
    app: true,
  };

  type FilterOptions = {
    includeDeleted: boolean;
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Documents.findById>>>;

  export const create = async (data: InferInput<typeof Documents.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Documents.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(documents).values(isValid.output).returning();
    const user = await Documents.findById(created.id)!;
    return user;
  };

  export const findById = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.documents.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...Documents._with,
      },
    });
  };

  export const findByFileName = async (name: string, tsx = db) => {
    return tsx.query.documents.findFirst({
      where: (fields, ops) => ops.eq(fields.filename, name),
      with: {
        ...Documents._with,
      },
    });
  };

  export const findByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.documents.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      with: {
        ...Documents._with,
      },
    });
  };

  export const update = async (data: InferInput<typeof Documents.UpdateSchema>, tsx = db) => {
    const isValid = safeParse(Documents.UpdateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.update(documents).set(isValid.output).where(eq(documents.id, isValid.output.id)).returning();
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
    return tsx.delete(documents).where(eq(documents.id, isValid.output)).returning();
  };

  export const findAll = async (tsx = db) => {
    return tsx.query.documents.findMany({
      with: {
        ...Documents._with,
      },
    });
  };

  export const findByOwnerId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.documents.findMany({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      with: {
        ...Documents._with,
      },
    });
  };

  export const findManyByApplicationToken = async (token: string, options?: FilterOptions, tsx = db) => {
    const application = await Applications.findByToken(token, tsx);
    if (!application) {
      return [];
    }

    const o = Object.assign(options ?? {}, {
      includeDeleted: false,
    } satisfies FilterOptions);

    return tsx.query.documents.findMany({
      where: (fields, opts) =>
        o.includeDeleted
          ? opts.eq(fields.app_id, application.id)
          : opts.and(opts.eq(fields.owner_id, application.id), opts.isNull(fields.deletedAt)),
      with: {
        ...Documents._with,
      },
    });
  };

  export const findManyByUserSessionToken = async (token: string, options?: FilterOptions, tsx = db) => {
    const user = await Users.findBySessionToken(token, tsx);
    if (!user) {
      throw new Error("User not found");
    }

    const o = Object.assign(options ?? {}, {
      includeDeleted: false,
    } satisfies FilterOptions);

    return tsx.query.documents.findMany({
      where: (fields, opts) =>
        o.includeDeleted
          ? opts.eq(fields.owner_id, user.id)
          : opts.and(opts.eq(fields.owner_id, user.id), opts.isNull(fields.deletedAt)),
      with: {
        ...Documents._with,
      },
    });
  };
}
