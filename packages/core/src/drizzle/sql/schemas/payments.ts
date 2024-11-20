import { UnitTypeLong, UnitTypeLongPlural } from "dayjs";
import { relations } from "drizzle-orm";
import { commonTable } from "./entity";
import { users } from "./users";

type ExcludedInterval = "millisecond" | "second" | "date";
type ExcludedIntervalPlural = ExcludedInterval | `${ExcludedInterval}s`;
type IntervalSingular = Exclude<UnitTypeLong, ExcludedInterval>;
type IntervalPlural = Exclude<UnitTypeLongPlural, ExcludedIntervalPlural>;
type NotOne<T> = T extends 1 ? never : T;
export type Intervals = `1 ${IntervalSingular}` | `${NotOne<number>} ${IntervalPlural}`;

export const payments = commonTable(
  "payments",
  (t) => ({
    owner_id: t.text("owner_id").references(() => users.id, { onDelete: "set null" }),
    name: t.text("name").notNull(),
    reoccuring: t.json("reoccuring").$type<{
      startsAt: Date;
      endsAt?: Date;
      interval: Intervals;
    }>(),
  }),
  "payment",
);

export type PaymentSelect = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;

export const payment_relation = relations(payments, ({ one }) => ({
  owner: one(users, {
    fields: [payments.owner_id],
    references: [users.id],
  }),
}));
