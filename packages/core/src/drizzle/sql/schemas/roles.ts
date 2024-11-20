import { schema } from "./utils";

export const client_role = schema.enum("client_role", ["web:admin", "web:member", "app:admin", "app:member"]);

export type UserRole = (typeof client_role.enumValues)[number];
