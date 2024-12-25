import { boolean, fallback, InferInput, optional, Prettify, strictObject } from "valibot";

export const ConfigSchema = strictObject({
  config: fallback(
    optional(
      strictObject({
        logging: fallback(optional(boolean()), false),
      }),
    ),
    {
      logging: false,
    },
  ),
});

type DeepRequired<T, P extends string[]> = T extends object
  ? Omit<T, Extract<keyof T, P[0]>> &
      Required<{
        [K in Extract<keyof T, P[0]>]: NonNullable<DeepRequired<T[K], ShiftUnion<K, P>>>;
      }>
  : T;

export type Shift<T extends any[]> = ((...t: T) => any) extends (first: any, ...rest: infer Rest) => any ? Rest : never;

type ShiftUnion<P extends PropertyKey, T extends any[]> = T extends any[] ? (T[0] extends P ? Shift<T> : never) : never;

export const DEFAULT_CONFIG = {
  logging: false,
} satisfies DeepRequired<InferInput<typeof ConfigSchema>, ["config"]>["config"];
