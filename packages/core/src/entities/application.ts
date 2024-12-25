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
import { applications_workflows } from "../drizzle/sql/schema";
import { ApplicationCreateSchema, applications, ApplicationUpdateSchema } from "../drizzle/sql/schemas/applications";
import { Validator } from "../validator";

export module Applications {
  export const CreateSchema = ApplicationCreateSchema;

  export const UpdateSchema = strictObject({
    ...ApplicationUpdateSchema.entries,
    id: Validator.Cuid2Schema,
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
                            task: {
                              with: {
                                owner: true,
                                previous_task: true,
                                used_in: true,
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
                            task: {
                              with: {
                                owner: true,
                                previous_task: true,
                                used_in: true,
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
                            task: {
                              with: {
                                owner: true,
                                previous_task: true,
                                used_in: true,
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
        },
      },
    });
  };

  export const findByUserId = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) throw isValid.issues;
    const apps = await tsx.query.applications.findMany({
      where: (fields, ops) => ops.and(ops.eq(fields.owner_id, isValid.output), ops.isNull(fields.deletedAt)),
      orderBy: (fields, operators) => [operators.asc(fields.createdAt), operators.asc(fields.name)],
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
                            task: {
                              with: {
                                owner: true,
                                previous_task: true,
                                used_in: true,
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
        },
      },
    });
    return apps.map((app) => ({
      ...app,
      workflows: app.workflows
        .filter((wf) => wf.workflow.deletedAt === null)
        .map((wf) => ({
          ...wf,
          workflow: {
            ...wf.workflow,
            steps: wf.workflow.steps
              .filter((step) => step.step.deletedAt === null)
              .map((s) => ({
                ...s,
                step: {
                  ...s.step,
                  tasks: s.step.tasks.filter((t) => t.task.deletedAt === null),
                },
              })),
          },
        })),
    }));
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
    let app = await tsx.query.applications.findFirst({
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
                            task: {
                              with: {
                                owner: true,
                                previous_task: true,
                                used_in: true,
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
        },
      },
    });

    // filter out workflows that are deleted
    if (app) {
      app = {
        ...app,
        workflows: app.workflows
          .filter((wf) => wf.workflow.deletedAt === null)
          .map((wf) => ({
            ...wf,
            workflow: {
              ...wf.workflow,
              steps: wf.workflow.steps
                .filter((step) => step.step.deletedAt === null)
                .map((s) => ({
                  ...s,
                  step: {
                    ...s.step,
                    tasks: s.step.tasks.filter((t) => t.task.deletedAt === null),
                  },
                })),
            },
          })),
      };
    }

    return app;
  };

  export const addWorkflow = async (
    applicationId: Validator.Cuid2SchemaInput,
    workflowId: Validator.Cuid2SchemaInput,
  ) => {
    // TODO: Add validation
    const added = await db
      .insert(applications_workflows)
      .values({ application_id: applicationId, workflow_id: workflowId })
      .returning();
    return added;
  };
}
