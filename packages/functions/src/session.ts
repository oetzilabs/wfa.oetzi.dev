import { auth } from "sst/auth";

export const sessions = auth.sessions<{
  user: {
    id: string;
  };
  app: {
    id: string;
    token: string;
  };
}>();
