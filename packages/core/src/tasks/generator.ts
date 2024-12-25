import { any, flatten, GenericSchema, InferInput, InferOutput, safeParse } from "valibot";

export module TaskGenerator {
  // Updated CreateFunctionSchema with relaxed type constraints
  export interface CreateFunctionSchema<I, O> {
    name: string;
    input: GenericSchema<I, I>; // Input schema
    output: GenericSchema<O, O>; // Success output schema
    fn: (input: InferOutput<this["input"]>) => Promise<InferOutput<this["output"]>> | InferOutput<this["output"]>;
  }

  export interface CreateSchema<I, O> {
    name: string;
    input: GenericSchema<I, I>; // Input schema
    outputs: {
      success: GenericSchema<O, O>; // Success output schema
      error: GenericSchema<unknown, any>; // Error output schema
    };
    fn: (
      input: InferOutput<this["input"]>,
    ) => Promise<InferOutput<this["outputs"]["success"]>> | InferOutput<this["outputs"]["success"]>;
  }

  export const create = <I, O>(setup: TaskGenerator.CreateFunctionSchema<I, O>) => {
    const schema: TaskGenerator.CreateSchema<I, O> = {
      name: setup.name,
      input: setup.input,
      fn: setup.fn,
      outputs: {
        success: setup.output,
        error: any(), // Default error schema
      },
    };

    const runner = async (input: I) => tryValidateOutput<I, O, typeof schema>(schema, input);

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
        error: flatten(parseInput.issues),
      } as const;
    }

    // Execute the function
    let fnResult: InferOutput<typeof SuccessSchema>;
    const start = Date.now();
    let end = Date.now();
    try {
      fnResult = await schema.fn(parseInput.output);
      end = Date.now();
    } catch (error) {
      console.error(error);
      end = Date.now();
      return {
        type: "error:fn",
        error,
        duration: end - start,
      } as const;
    }

    // Validate success schema
    const parsedOutput = safeParse(SuccessSchema, fnResult);
    if (!parsedOutput.success) {
      return {
        type: "error:success",
        error: flatten(parsedOutput.issues),
        duration: end - start,
      } as const;
    }

    return {
      type: "success",
      data: parsedOutput.output as InferOutput<typeof SuccessSchema>,
      duration: end - start,
    } as const;
  };
}

export interface ExportTaskSchema {
  name: string;
  schema: TaskGenerator.CreateSchema<any, any>;
  task: this["schema"]["fn"];
  example: string;
  blueprints: {
    input: string;
    output: string;
    errors: string;
  };
  notes: string;
}
