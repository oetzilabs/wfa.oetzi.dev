import type {
  ArraySchema,
  BaseSchema,
  LiteralSchema,
  NullableSchema,
  ObjectSchema,
  OptionalSchema,
  PicklistSchema,
  RecordSchema,
  StrictObjectSchema,
  UnionSchema,
  VariantSchema,
} from "valibot";
import { BaseIssue } from "valibot";

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

export const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  const cleaned = { ...obj };
  keys_to_remove.forEach((key) => delete cleaned[key]);
  return cleaned;
};

export const valibot_to_string = <T extends BaseSchema<any, any, any>>(
  schema: T,
): string | Record<string, any> | any[] => {
  if (!schema) return "unknown";
  type Message = BaseIssue<typeof schema>["message"];
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
      const literalSchema = schema as unknown as LiteralSchema<any, Message>;
      return `literal:${literalSchema.literal}`;
    }
    case "nullable": {
      const nullableSchema = schema as unknown as NullableSchema<any, Message>;
      return {
        type: "nullable",
        value: valibot_to_string(nullableSchema.wrapped),
      };
    }
    case "optional": {
      const optionalSchema = schema as unknown as OptionalSchema<any, Message>;
      return {
        type: "optional",
        value: valibot_to_string(optionalSchema.wrapped),
      };
    }
    case "object": {
      const objSchema = schema as unknown as ObjectSchema<any, Message>;
      const entries = Object.entries(objSchema.entries || {});
      if (entries.length === 0) return "{}";

      const objResult: Record<string, any> = {};
      entries.forEach(([key, value]: [string, any]) => {
        objResult[key] = valibot_to_string(value);
      });
      return objResult;
    }
    case "record": {
      const recordSchema = schema as unknown as RecordSchema<any, any, Message>;
      return `Record<${valibot_to_string(recordSchema.key)}, ${valibot_to_string(recordSchema.value)}>`;
    }
    case "any": {
      return "any";
    }
    case "strict_object": {
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
      const variantSchema = schema as unknown as VariantSchema<any, any, Message>;
      if (!variantSchema.options) return "unknown";

      const mergedResults: Record<string, Set<string>> = {};

      variantSchema.options.forEach((opt: any) => {
        const result = valibot_to_string(opt);
        if (typeof result === "object") {
          Object.entries(result).forEach(([key, value]) => {
            if (!mergedResults[key]) mergedResults[key] = new Set();
            mergedResults[key].add(JSON.stringify(value));
          });
        }
      });

      const finalResult: Record<string, any> = {};
      Object.entries(mergedResults).forEach(([key, values]) => {
        const uniqueValues = Array.from(values).map((v) => JSON.parse(v));
        finalResult[key] = uniqueValues.length === 1 ? uniqueValues[0] : uniqueValues.join(" | ");
      });

      return finalResult;
    }
    case "picklist": {
      const picklistSchema = schema as unknown as PicklistSchema<any, Message>;
      return picklistSchema.expects.replaceAll('"', "'");
    }
    case "array": {
      const arraySchema = schema as unknown as ArraySchema<any, Message>;
      return arraySchema.item ? valibot_to_string(arraySchema.item) : "unknown[]";
    }
    case "union": {
      const unionSchema = schema as unknown as UnionSchema<any, Message>;
      if (!unionSchema.options) return "unknown";

      const options = unionSchema.options.map((opt: any) => {
        if (opt.kind === "literal") return (opt as LiteralSchema<any, Message>).literal;
        return valibot_to_string(opt);
      });
      return options;
    }
    default:
      console.log(schemaType);
      return "unknown";
  }
};

export const formatSchema = <T extends BaseSchema<any, any, any>>(schema: T): string => {
  const result = valibot_to_string(schema);
  return typeof result === "object" ? JSON.stringify(result, null, 2) : result;
};
