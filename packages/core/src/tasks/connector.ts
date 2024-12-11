import { InferInput, InferOutput } from "valibot";
import { TaskGenerator } from "./generator";

export module TaskConnector {
  export type Task<I, O> = ReturnType<typeof TaskGenerator.create<I, O>>;

  type TransformFunction<T1Output, T2Input> = (input: T1Output) => Promise<T2Input> | T2Input;

  type PipeElement<T1Input, T1Output, T2Input, T2Output> = [
    Task<T1Input, T1Output>,
    Task<T2Input, T2Output>,
    TransformFunction<T1Output, T2Input>,
  ];

  export function pipe<T1Input, T1Output, T2Input, T2Output>(
    elements: [PipeElement<T1Input, T1Output, T2Input, T2Output>],
  ): Task<T1Input, T2Output>;

  export function pipe<T1Input, T1Output, T2Input, T2Output, T3Input, T3Output>(
    elements: [PipeElement<T1Input, T1Output, T2Input, T2Output>, PipeElement<T2Output, T2Output, T3Input, T3Output>],
  ): Task<T1Input, T3Output>;

  // Add more overloads for longer pipes if needed

  export function pipe(elements: PipeElement<any, any, any, any>[]): Task<any, any> {
    if (elements.length === 0) {
      throw new Error("At least one pipe element is required");
    }

    let [currentTask, _, __] = elements[0];

    for (let i = 0; i < elements.length; i++) {
      const [task1, task2, transform] = elements[i];
      const [schema1, runner1] = currentTask;
      const [schema2, runner2] = task2;

      currentTask = TaskGenerator.create({
        name: `${schema1.name}_to_${schema2.name}`,
        input: schema1.input,
        output: schema2.outputs.success,
        fn: async (input) => {
          const result1 = await runner1(input);
          if (result1.type !== "success") {
            throw result1.error;
          }

          const transformedInput = await transform(result1.data);

          const result2 = await runner2(transformedInput);
          if (result2.type !== "success") {
            throw result2.error;
          }

          return result2.data;
        },
      });
    }

    return currentTask;
  }
}
