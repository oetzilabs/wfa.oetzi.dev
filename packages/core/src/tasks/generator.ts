import { any, flatten, GenericSchema, InferInput, InferOutput, safeParse } from "valibot";

// Task Collection module
export module TaskGenerator {
  // Interface for defining a task
  export interface CreateSchema<I, O> {
    name: string;
    input: GenericSchema<I, I>; // Input schema
    outputs: {
      success: GenericSchema<unknown, O>; // Success output schema
      error: GenericSchema<unknown, any>; // Error output schema
    };
    fn: (
      input: InferOutput<this["input"]>,
    ) => Promise<InferOutput<this["outputs"]["success"]>> | InferOutput<this["outputs"]["success"]>;
  }

  export interface CreateFunctionSchema<I, O> {
    name: string;
    input: GenericSchema<I, I>; // Input schema
    output: GenericSchema<unknown, O>; // Success output schema
    fn: (input: InferInput<this["input"]>) => Promise<InferOutput<this["output"]>> | InferOutput<this["output"]>;
  }

  export const create = <I, O>(setup: CreateFunctionSchema<I, O>) => {
    const schema: CreateSchema<I, O> = {
      name: setup.name,
      input: setup.input,
      fn: setup.fn,
      outputs: {
        success: setup.output,
        error: any(), // Default error schema
      },
    };

    // Runner function that validates input and output
    const runner = async (input: InferInput<(typeof schema)["input"]>) =>
      tryValidateOutput<I, O, typeof schema>(schema, input);

    return [schema, runner] as const;
  };

  const tryValidateOutput = async <I, O, CS extends CreateSchema<I, O>>(schema: CS, value: InferInput<CS["input"]>) => {
    const { input, outputs } = schema;
    const { success: SuccessSchema } = outputs;

    // Validate input schema
    const parseInput = safeParse(input, value);
    if (!parseInput.success) {
      return {
        type: "error:input",
        error: flatten(parseInput.issues), // Flatten input schema issues
      } as const;
    }

    // Execute the function
    let fnResult: InferOutput<typeof SuccessSchema>;
    try {
      fnResult = await schema.fn(parseInput.output);
    } catch (error) {
      return {
        type: "error:fn",
        error,
      } as const;
    }

    // Validate success schema
    const parsedOutput = safeParse(SuccessSchema, fnResult);
    if (!parsedOutput.success) {
      return {
        type: "error:success",
        error: flatten(parsedOutput.issues), // Flatten success schema issues
      } as const;
    }

    // Return success
    return {
      type: "success",
      data: parsedOutput.output as InferOutput<typeof SuccessSchema>,
    } as const;
  };
}
