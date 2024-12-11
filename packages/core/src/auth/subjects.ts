import { createSubjects } from "@openauthjs/openauth";
import { object, string } from "valibot";

export const subjects = createSubjects({
  user: object({
    id: string(),
    email: string(),
  }),
  app: object({
    id: string(),
    token: string(),
  }),
});
