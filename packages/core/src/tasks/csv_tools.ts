import { csv2json, json2csv } from "json-2-csv";
import { any, array, fallback, literal, optional, picklist, strictObject, string, unknown } from "valibot";
import { ConfigSchema } from "./config";
import { TaskGenerator } from "./generator";

export const Json_To_CSV = TaskGenerator.create({
  name: "json_to_csv",
  input: strictObject({
    value: array(any()),
    delimiter: fallback(optional(picklist([",", ";"])), ","),
    ...ConfigSchema.entries,
  }),
  output: strictObject({
    value: string(),
    delimiter: fallback(optional(picklist([",", ";"])), ","),
  }),
  fn: async (input) => {
    const logging = true && (input.config?.logging ?? false);
    const value = input.value;
    if (logging) console.dir(value, { depth: Infinity });

    const result = json2csv(value, { delimiter: { eol: "\n", field: input.delimiter } });

    return {
      value: result,
      delimiter: input.delimiter,
    };
  },
});

export const CSV_To_Json = TaskGenerator.create({
  name: "csv_to_json",
  input: strictObject({
    value: string(),
    delimiter: fallback(optional(picklist([",", ";"])), ","),
    ...ConfigSchema.entries,
  }),
  output: strictObject({
    value: unknown(),
    delimiter: fallback(optional(picklist([",", ";"])), ","),
  }),
  fn: async (input) => {
    const logging = true && (input.config?.logging ?? false);
    const value = input.value;
    if (logging) console.log(value);

    const result = csv2json(value, { delimiter: { eol: "\n", field: input.delimiter } });

    return {
      value: result,
      delimiter: input.delimiter,
    };
  },
});

export const [JsonToCsvSchema, json_to_csv] = Json_To_CSV;
export const [CsvToJsonSchema, csv_to_json] = CSV_To_Json;
