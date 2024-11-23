import { secret } from "./Secrets";

export const dockerstart = new sst.x.DevCommand("DB_DockerStart", {
  dev: {
    command: "docker compose up -d",
    autostart: true,
  },
});

export const migration = new sst.x.DevCommand("DB_Migration", {
  dev: {
    command: "bun run drizzle-kit migrate",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});

export const seed = new sst.x.DevCommand("DB_Seed", {
  dev: {
    command: "bun run ./src/entities/seed.ts",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});

export const generate = new sst.x.DevCommand("DB_Generate", {
  dev: {
    command: "bun run drizzle-kit generate",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});

export const studio = new sst.x.DevCommand("DB_Studio", {
  dev: {
    command: "bun run drizzle-kit studio --host 0.0.0.0",
    directory: "packages/core",
    autostart: false,
  },
  link: [secret.SECRET_DATABASE_URL, secret.SECRET_DATABASE_PROVIDER],
});
