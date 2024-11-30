import { any, flatten, GenericSchema, InferInput, InferOutput, safeParse } from "valibot";

// Task Collection module
export module TaskGenerator {
  export interface CreateSchema<I, O> {
    input: GenericSchema<I, I>;
    outputs: {
      success: GenericSchema<unknown, O>;
      error: GenericSchema<unknown, any>;
    };
    fn: (
      input: InferOutput<this["input"]>,
    ) => Promise<InferOutput<this["outputs"]["success"]>> | InferOutput<this["outputs"]["success"]>;
  }

  export interface CreateFunctionSchema<I, O> {
    input: GenericSchema<I, I>;
    success: GenericSchema<unknown, O>;
    fn: (input: InferOutput<this["input"]>) => Promise<InferOutput<this["success"]>>;
  }

  export const create = <I, O>(setup: CreateFunctionSchema<I, O>) => {
    const schema = {
      input: setup.input,
      fn: setup.fn,
      outputs: {
        success: setup.success,
        error: any(),
      },
    };
    const runner = (input: InferInput<(typeof schema)["input"]>) => tryValidateOutput(schema, input);
    return [schema, runner] as const;
  };

  export const tryValidateOutput = async <I, O, CS extends CreateSchema<I, O>>(
    schema: CS,
    value: InferInput<CS["input"]>,
  ) => {
    const { input, outputs } = schema;
    const { success: SuccessSchema } = outputs;

    // Parse input
    const parseInput = safeParse(input, value);
    if (!parseInput.success) {
      return {
        type: "error:input",
        error: flatten(parseInput.issues), // Flatten input issues
      } as const;
    }

    const fn = schema.fn;
    let fnResult: InferOutput<typeof SuccessSchema>;
    try {
      fnResult = await fn(parseInput.output);
    } catch (error) {
      return {
        type: "error:fn",
        error,
      } as const;
    }

    // Validate against success schema
    const parsedOutput = safeParse(SuccessSchema, fnResult);
    if (!parsedOutput.success) {
      return {
        type: "error:success",
        error: flatten(parsedOutput.issues), // Flatten success schema issues
      } as const;
    }

    return {
      type: "success",
      data: parsedOutput.output, // Parsed and validated success data
    } as const;
  };
}
