import { strictObject, string } from "valibot";
import { ConfigSchema } from "./config";
import { TaskGenerator } from "./generator";

export const HelloWorld = TaskGenerator.create({
  name: "hello_world",
  input: strictObject({
    name: string(),
    ...ConfigSchema.entries,
  }),
  output: strictObject({
    hello: string(),
  }),
  fn: async (input) => {
    const logging = true && (input.config?.logging ?? true);
    if (logging) console.log(`Hello, ${input.name}!`);
    return {
      hello: input.name,
    };
  },
});

export const [HelloWorldSchema, hello_world] = HelloWorld;

// const result = await hello_world({
//   name: "world",
// });

// result.type === "success" ? console.log(result.data) : console.log(result.error);
