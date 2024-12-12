import { desc, eq } from "drizzle-orm";
import {
  date,
  flatten,
  InferInput,
  InferOutput,
  intersect,
  null as null_,
  nullable,
  object,
  objectWithRest,
  optional,
  partial,
  Prettify,
  safeParse,
  safeParser,
  strictObject,
  string,
  ValiError,
} from "valibot";
import { db } from "../drizzle/sql";
import { ApplicationCreateSchema, applications } from "../drizzle/sql/schemas/applications";
import { Validator } from "../validator";

export module Applications {
  export const CreateSchema = strictObject({
    name: string(),
    token: optional(string()),
    owner_id: Validator.Cuid2Schema,
  });

  export const UpdateSchema = strictObject({
    id: Validator.Cuid2Schema,
    ...strictObject({ deletedAt: optional(nullable(date())) }).entries,
    ...partial(Applications.CreateSchema).entries,
  });

  export type WithOptions = NonNullable<Parameters<typeof db.query.applications.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    owner: true,
    workflows: {
      with: {
        workflow: {
          with: {
            steps: {
              with: {
                step: {
                  with: {
                    tasks: {
                      with: {
                        task: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  export type Info = NonNullable<Awaited<ReturnType<typeof Applications.findById>>>;
  export type UpdateInfo = Prettify<InferOutput<typeof Applications.UpdateSchema>>;

  export const create = async (data: InferInput<typeof Applications.CreateSchema>, tsx = db) => {
    const isValid = safeParse(Applications.CreateSchema, data);
    if (!isValid.success) {
      throw isValid.issues;
    }
    const [created] = await tsx.insert(applications).values(isValid.output).returning();
    const user = await Applications.findById(created.id)!;
    return user;
  };

  export const findById = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.applications.findFirst({
      where: (fields, ops) => ops.eq(fields.id, isValid.output),
      with: {
        ...Applications._with,
        workflows: {
          with: {
            workflow: {
              with: {
                steps: {
                  with: {
                    step: {
                      with: {
                        tasks: {
                          with: {
                            task: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  };

  export const findByToken = async (token: string, tsx = db) => {
    return tsx.query.applications.findFirst({
      where: (fields, ops) => ops.eq(fields.token, token),
      with: {
        ...Applications._with,
        workflows: {
          with: {
            workflow: {
              with: {
                steps: {
                  with: {
                    step: {
                      with: {
                        tasks: {
                          with: {
                            task: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  };

  export const findByName = async (name: string, tsx = db) => {
    return tsx.query.applications.findFirst({
      where: (fields, ops) => ops.eq(fields.name, name),
      with: {
        ...Applications._with,
        workflows: {
          with: {
            workflow: {
              with: {
                steps: {
                  with: {
                    step: {
                      with: {
                        tasks: {
                          with: {
                            task: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  };

  export const findByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    return tsx.query.applications.findMany({
      where: (fields, ops) => ops.and(ops.eq(fields.owner_id, isValid.output), ops.isNull(fields.deletedAt)),
      with: {
        ...Applications._with,
        workflows: {
          with: {
            workflow: {
              with: {
                steps: {
                  with: {
                    step: {
                      with: {
                        tasks: {
                          with: {
                            task: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  };

  export const update = async (data: UpdateInfo, tsx = db) => {
    const isValid = safeParse(Applications.UpdateSchema, data);
    if (!isValid.typed) {
      if (!isValid.success) {
        throw new ValiError(isValid.issues);
      }
    }
    return tsx.update(applications).set(isValid.output).where(eq(applications.id, isValid.output.id)).returning();
  };

  export const remove = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    console.log("removing application" + isValid.output);
    return update({ id: isValid.output, deletedAt: new Date() }, tsx);
  };

  export const forceDelete = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.delete(applications).where(eq(applications.id, isValid.output)).returning();
  };

  export const lastCreatedByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.query.applications.findFirst({
      where: (fields, ops) => ops.eq(fields.owner_id, isValid.output),
      orderBy: [desc(applications.createdAt)],
      with: {
        ...Applications._with,
        workflows: {
          with: {
            workflow: {
              with: {
                steps: {
                  with: {
                    step: {
                      with: {
                        tasks: {
                          with: {
                            task: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  };
}
