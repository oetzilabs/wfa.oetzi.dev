import { toJsonSchema } from "@valibot/to-json-schema";
import { date, strictObject, string } from "valibot";
import { ConfigSchema } from "./config";
import { ExportTaskSchema, TaskGenerator } from "./generator";
import { formatSchema } from "./utils";

const [HelloWorldSchema, hello_world] = TaskGenerator.create({
  name: "hello_world",
  input: strictObject({
    name: string(),
    ...ConfigSchema.entries,
  }),
  output: strictObject({
    hello: string(),
  }),
  fn: async (input) => {
    const logging = true && (input.config?.logging ?? false);
    if (logging) console.log(`Hello, ${input.name}!`);
    // await setTimeout(1000);
    return {
      hello: input.name,
    };
  },
});

// const result = await hello_world({
//   name: "world",
// });

// result.type === "success" ? console.log(result.data) : console.log(result.error);

export default {
  name: "hello_world",
  schema: HelloWorldSchema,
  task: hello_world,
  example: JSON.stringify({ name: "AAAAA" }, null, 2),
  blueprints: {
    input: formatSchema(HelloWorldSchema.input),
    output: formatSchema(HelloWorldSchema.outputs.success),
    errors: formatSchema(HelloWorldSchema.outputs.error),
  },
  notes:
    "This task will fetch exchange rates from a link 'currency-api.pages.dev' and return the exchange rate for the given currencies.",
} satisfies ExportTaskSchema;
