import { query } from "@solidjs/router";
import { getCookie, getHeader } from "vinxi/http";
import { getContext } from "../auth/context";

export const getLanguage = query(async () => {
  "use server";
  let language = "en";
  const [ctx, event] = await getContext();
  if (!ctx) return language;
  if (!ctx.session) return language;
  if (!ctx.user) return language;
  // check cookie
  const c = getCookie("language");
  if (c) {
    language = c;
  }
  // check request header or cookie
  const h = getHeader("accept-language");
  if (h) {
    language = h.split(",")[0];
  }
  return language;
}, "language");
