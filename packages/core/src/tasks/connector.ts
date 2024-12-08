import { InferInput, InferOutput } from "valibot";
import { TaskGenerator } from "./generator";

export module TaskConnector {
  export type Task<I, O> = ReturnType<typeof TaskGenerator.create<I, O>>;

  interface Connector<T1Input, T1Output, T2Input, T2Output> {
    tasks: readonly [Task<T1Input, T1Output>, Task<T2Input, T2Output>];
    transform(input: T1Output): Promise<T2Input> | T2Input;
  }

  export const pipe = <T1Input, T1Output, T2Input, T2Output>(
    connector: Connector<T1Input, T1Output, T2Input, T2Output>,
  ) => {
    const [task1, task2] = connector.tasks;

    const [schema1, runner1] = task1;
    const [schema2, runner2] = task2;

    // Create the new schema for the pipeline task
    const SchemaRunner = TaskGenerator.create({
      name: `${schema1.name}_to_${schema2.name}`,
      input: schema1.input, // The input of the pipeline is the same as task1 input
      output: schema2.outputs.success, // The output is the success of task2
      fn: async (input) => {
        // Execute task1 with input
        const result1 = await runner1(input);
        if (result1.type !== "success") {
          throw result1.error;
        }

        // Transform the result from task1 using connector's transform function
        const transformedInput = await connector.transform(result1.data);

        // Execute task2 with the transformed input
        const result2 = await runner2(transformedInput);
        if (result2.type !== "success") {
          throw result2.error;
        }

        return result2.data;
      },
    });

    return SchemaRunner;
  };
}
