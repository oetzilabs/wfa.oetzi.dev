import { eq } from "drizzle-orm";
import {
  array,
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
import { UserCreateSchema, users, UserUpdateSchema } from "../drizzle/sql/schemas/users";
import { Validator } from "../validator";
import { Organizations } from "./organizations";

export module Users {
  export const CreateSchema = UserCreateSchema;

  export const UpdateSchema = strictObject({
    ...UserUpdateSchema.entries,
    id: Validator.Cuid2Schema,
  });

  export type WithOptions = NonNullable<Parameters<typeof db.query.users.findFirst>[0]>["with"];
  export const _with: WithOptions = {
    orgs: {
      with: {
        user: true,
      },
    },
    applications: {
      where: (fields, operators) => operators.isNull(fields.deletedAt),
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

  export const findById = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
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

  export const findBySessionToken = async (token: string, tsx = db) => {
    const session = await tsx.query.sessions.findFirst({
      where: (fields, ops) => ops.eq(fields.access_token, token),
      with: {
        user: true,
      },
    });
    if (!session) {
      throw new Error("Session not found");
    }
    return session.user;
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

  export const remove = async (id: Validator.Cuid2SchemaInput, tsx = db) => {
    const isValid = safeParse(Validator.Cuid2Schema, id);
    if (!isValid.success) {
      throw isValid.issues;
    }
    return tsx.delete(users).where(eq(users.id, isValid.output)).returning();
  };

  export const seed = async (data: InferInput<typeof CreateSchema>[] = []) => {
    const created_users = [];
    const created_organizations = [];
    if (data.length === 0) {
      console.log("Creating admin user and company");
      const adminUserExists = await Users.findByEmail("admin@wfa.oetzi.dev");
      if (!adminUserExists) {
        const adminUser = await Users.create({
          email: "admin@wfa.oetzi.dev",
          verifiedAt: new Date(),
          name: "Admin",
        });
        if (!adminUser) {
          throw new Error("Could not create user");
        }
        created_users.push(adminUser);
        console.log("Admin user created");
        const adminCompanyExists = await Organizations.findByName("QWERTY Studios");

        if (!adminCompanyExists) {
          const adminCompany = await Organizations.create({
            email: "admin@wfa.oetzi.dev",
            owner_id: adminUser!.id,
            name: "QWERTY Studios",
            website: "https://wfa.oetzi.dev",
          });
          if (!adminCompany) {
            throw new Error("Could not create organization");
          }
          created_organizations.push(adminCompany);
          console.log("Admin organization created");
        }
      }

      console.log("Creating test user and company");
      const testUserExists = await Users.findByEmail("testuser@wfa.oetzi.dev");

      if (!testUserExists) {
        const testUser = await Users.create({
          email: "testuser@wfa.oetzi.dev",
          verifiedAt: new Date(),
          name: "Test",
        });
        if (!testUser) {
          throw new Error("Could not create user");
        }
        created_users.push(testUser);
        console.log("Test user created");
        const testCompanyExists = await Organizations.findByName("Test Company");
        if (!testCompanyExists) {
          const testCompany = await Organizations.create({
            email: "testuser@wfa.oetzi.dev",
            owner_id: testUser!.id,
            name: "Test Company",
            website: "https://wfa.oetzi.dev",
          });
          if (!testCompany) {
            throw new Error("Could not create organization");
          }
          created_organizations.push(testCompany);
          console.log("Test company created");
        }
      }
    } else {
      const is_valid_data = safeParse(array(CreateSchema), data);

      if (!is_valid_data.success) {
        throw is_valid_data.issues;
      }

      for (const user of data) {
        const userExists = await Users.findByEmail(user.email);
        if (!userExists) {
          const createdUser = await Users.create(user);
          if (!createdUser) {
            throw new Error("Could not create user");
          }
          created_users.push(createdUser);
          console.log(`User ${createdUser.email} created`);
        }
      }
    }
  };
}
