import { createId } from "@paralleldrive/cuid2";
import { BuildExtraConfigColumns, Table } from "drizzle-orm";
import { PgColumnBuilderBase, PgTableExtraConfig, timestamp, varchar } from "drizzle-orm/pg-core";
import { PgColumnsBuilders } from "drizzle-orm/pg-core/columns/all";
import { schema } from "./utils";

export * as Entity from "./entity";

const defaults = (t: PgColumnsBuilders, prefix: string) => ({
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `${prefix}_${createId()}`),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export function commonTable<
  TTableName extends string,
  TColumnsMap extends Record<string, PgColumnBuilderBase>,
  TPrefix extends string,
>(
  name: TTableName,
  columns: (columnTypes: PgColumnsBuilders) => TColumnsMap,
  prefix: TPrefix,
  extraConfig?: (
    self: BuildExtraConfigColumns<TTableName, TColumnsMap & ReturnType<typeof defaults>, "pg">,
  ) => PgTableExtraConfig[],
) {
  return schema.table<TTableName, TColumnsMap & ReturnType<typeof defaults>>(
    name,
    (t: PgColumnsBuilders) => Object.assign(columns(t), defaults(t, prefix)),
    extraConfig,
  );
}

export function createToken(length = 8) {
  // create a random alphanumeric string but remove the letters i, o, and l to avoid confusion with 1, 0, and L. we are going to uppercase the result anyway.
  let token = "";
  do {
    token = Math.random().toString(36).replaceAll(/[iol]/g, "").slice(0, length).toUpperCase();
  } while (token.length < length);

  return token;
}
