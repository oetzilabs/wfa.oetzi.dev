import { query } from "@solidjs/router";
import { ensureAuthenticated } from "../auth/context";

export const getStorageStatistics = query(async () => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  return {
    space: {
      used: 0,
      total: 2048,
    },
    files: {
      used: 0,
      total: 100,
    },
    mails: {
      used: 0,
      total: 25,
    },
  };
}, "storage-statistics");
