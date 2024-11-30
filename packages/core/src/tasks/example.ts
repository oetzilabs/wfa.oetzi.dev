import { InferInput, InferOutput, strictObject, string } from "valibot";
import { TaskGenerator } from "./generator";

const [schema, run] = TaskGenerator.create({
  input: strictObject({
    b: string(),
  }),
  success: strictObject({
    a: string(),
  }),
  fn: async (input) => {
    console.log("hello from fn");
    return {
      a: input.b,
    };
  },
});

console.time();
const result = await run({
  b: "c",
});
console.timeEnd();
console.log(result);
