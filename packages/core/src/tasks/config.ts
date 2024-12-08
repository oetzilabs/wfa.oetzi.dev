import { boolean, fallback, optional, strictObject } from "valibot";

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
