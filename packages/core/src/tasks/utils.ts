import type {
  ArraySchema,
  BaseSchema,
  LiteralSchema,
  NullableSchema,
  ObjectSchema,
  OptionalSchema,
  PicklistSchema,
  StrictObjectSchema,
  UnionSchema,
  VariantSchema,
} from "valibot";
import { BaseIssue, unwrap } from "valibot";

// Keys to remove from schema objects for cleaner output
const keys_to_remove = [
  "~standard",
  "~run",
  "~types",
  "kind",
  "expects",
  "async",
  "key",
  "type",
  "requirement",
  "wrapped",
  "fallback",
];

/**
 * Removes internal valibot keys from an object
 * @param obj - Any object to clean
 * @returns Cleaned object without internal keys
 */
export const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  const cleaned = { ...obj };
  keys_to_remove.forEach((key) => delete cleaned[key]);
  return cleaned;
};

/**
 * Converts a valibot schema to a string representation
 * @param schema - Valibot schema to convert
 * @returns String representation of the schema
 */
export const valibot_to_string = <T extends BaseSchema<any, any, any>>(
  schema: T,
): string | Record<string, any> | any[] => {
  if (!schema) return "unknown";
  type Message = BaseIssue<typeof schema>["message"];
  // Get the schema type from the kind property
  const schemaType = (schema as BaseSchema<any, any, any>).type;

  switch (schemaType) {
    case "string":
      return "string";

    case "number":
      return "number";

    case "boolean":
      return "boolean";

    case "date":
      return "date";

    case "literal": {
      // For literals, show the actual value: literal:<value>
      const literalSchema = schema as unknown as LiteralSchema<any, Message>;
      return `literal:${literalSchema.literal}`;
    }

    case "nullable": {
      // Show the wrapped type with "| null"
      const nullableSchema = schema as unknown as NullableSchema<any, Message>;
      return `${valibot_to_string(nullableSchema.wrapped)} | null`;
    }

    case "optional": {
      // Show the wrapped type with "?"
      const optionalSchema = schema as unknown as OptionalSchema<any, Message>;
      const unwr = valibot_to_string(optionalSchema.wrapped);

      return {
        type: "optional",
        value: unwr,
      };
    }

    case "object": {
      // Convert each property of the object schema
      const objSchema = schema as unknown as ObjectSchema<any, Message>;
      const entries = Object.entries(objSchema.entries || {});
      if (entries.length === 0) return "{}";

      const objResult: Record<string, any> = {};
      entries.forEach(([key, value]: [string, any]) => {
        objResult[key] = valibot_to_string(value);
      });
      return objResult;
    }
    case "strict_object": {
      // Convert each property of the object schema
      const objSchema = schema as unknown as StrictObjectSchema<any, Message>;
      const entries = Object.entries(objSchema.entries || {});
      if (entries.length === 0) return "{}";

      const objResult: Record<string, any> = {};
      entries.forEach(([key, value]: [string, any]) => {
        objResult[key] = valibot_to_string(value);
      });
      return objResult;
    }

    case "variant": {
      // For variants, show the possible values
      const variantSchema = schema as unknown as VariantSchema<any, any, Message>;
      if (variantSchema.options) {
        const options = variantSchema.options.map((opt: any) => valibot_to_string(opt));
        return options;
      }
    }

    case "picklist": {
      // For picklists, show the possible values
      const picklistSchema = schema as unknown as PicklistSchema<any, Message>;
      return picklistSchema.expects.replaceAll('"', "'");
    }

    case "array": {
      // Show item type with [] suffix
      const arraySchema = schema as unknown as ArraySchema<any, Message>;
      if (arraySchema.item) {
        const aiof = valibot_to_string(arraySchema.item);
        return aiof;
      }
      return "unknown[]";
    }

    case "union": {
      // For unions, return array of possible values/types
      const unionSchema = schema as unknown as UnionSchema<any, Message>;
      if (unionSchema.options) {
        const options = unionSchema.options.map((opt: any) => {
          if (opt.kind === "literal") {
            return (opt as LiteralSchema<any, Message>).literal;
          }
          return valibot_to_string(opt);
        });
        return options;
      }
      console.log(schemaType);
      return "unknown";
    }

    default:
      console.log(schemaType);
      return "unknown";
  }
};

/**
 * Formats a schema into a JSON string
 * @param schema - Schema to format
 * @returns Formatted JSON string
 */
export const formatSchema = <T extends BaseSchema<any, any, any>>(schema: T): string => {
  const result = valibot_to_string(schema);
  return typeof result === "object" ? JSON.stringify(result, null, 2) : result;
};
