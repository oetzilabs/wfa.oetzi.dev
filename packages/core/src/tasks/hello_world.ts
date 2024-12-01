import { strictObject, string } from "valibot";
import { TaskGenerator } from "./generator";

export const [HelloWorldSchema, hello_world] = TaskGenerator.create({
  name: "hello_world",
  input: strictObject({
    name: string(),
  }),
  output: strictObject({
    hello: string(),
  }),
  fn: async (input) => {
    return {
      hello: input.name,
    };
  },
});

const result = await hello_world({
  name: "world",
});

result.type === "success" ? console.log(result.data) : console.log(result.error);
