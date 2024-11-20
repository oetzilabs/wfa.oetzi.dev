import { query } from "@solidjs/router";
import { Users } from "@wfa/core/src/entities/users";
import { getCookie, getHeader } from "vinxi/http";
import { ensureAuthenticated } from "../auth/context";

export const getStatistics = query(async () => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  return {
    documents: {
      value: 0,
      priority: 2,
      description: "All the rides you have done",
    },
    completed: {
      value: 0,
      priority: 1,
      description: `In total 0 documents have been successfully completed their workflows`,
    },
    failed: {
      value: 0,
      priority: 2,
      description: "In total 0 documents have failed their workflows",
    },
    "average rate": {
      value: 0,
      priority: 2,
      description: "Your performance",
    },
  };
}, "statistics");

export const getSystemStatistics = query(async () => {
  "use server";
  const [ctx, event] = await ensureAuthenticated();

  return {
    documents: {
      value: 0,
      prefix: "",
      sufix: "",
      priority: 2,
      description: "All the rides you have done",
    },
    completed: {
      value: 0,
      priority: 1,
      description: `In total 0 documents have been successfully completed their workflows`,
    },
    failed: {
      value: 0,
      prefix: "",
      sufix: "",
      priority: 2,
      description: "In total 0 documents have failed their workflows",
    },
    "average rate": {
      value: 0,
      prefix: "",
      sufix: "%",
      priority: 2,
      description: "Your performance",
    },
  };
}, "system-statistics");
