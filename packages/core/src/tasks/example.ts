import { strictObject, string } from "valibot";
import { TaskGenerator } from "./generator";

const [schema, run] = TaskGenerator.create({
  input: strictObject({
    b: string(),
  }),
  output: strictObject({
    c: string(),
  }),
  fn: async (input) => {
    return {
      c: input.b,
    };
  },
});

const result = await run({
  b: "hello",
});

console.log(result);
result.type === "success" ? console.log(result.data.c) : console.log(result.error);
