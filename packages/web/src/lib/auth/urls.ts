import { query } from "@solidjs/router";
import { GoogleClient } from "./client";

export const get_google_login = query(async () => {
  "use server";
  const google_login = await GoogleClient.authorize(import.meta.env.VITE_LOGIN_REDIRECT_URI, "code");
  return google_login.url;
}, "login-urls");
