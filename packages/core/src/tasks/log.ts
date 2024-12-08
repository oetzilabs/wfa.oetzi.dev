import { any, GenericSchema, InferInput } from "valibot";
import { TaskConnector } from "./connector";
import { Exchange } from "./currency_exchange";
import { TaskGenerator } from "./generator";
import { HelloWorld } from "./hello_world";

const Logger = <I>(passthrough_schema: GenericSchema<I, I>) =>
  TaskGenerator.create({
    name: "logger",
    input: passthrough_schema,
    output: passthrough_schema,
    fn: async (input) => {
      console.dir(input, {
        depth: Infinity,
      });
      return input;
    },
  });

const LoggerExample = <I, O>(task: TaskConnector.Task<I, O>) =>
  TaskConnector.pipe({
    tasks: [Logger(task[0].input), task] as const,
    transform: async (input) => input,
  });

// Run the resulting task
const [HelloWorldCurrencyExchangerSchema, HelloWorldCurrencyExchangeRunner] = LoggerExample(Exchange);
const finalResult = await HelloWorldCurrencyExchangeRunner({
  date: "latest",
  from: "eur",
  to: ["usd", "chf"],
  value: 100,
});
console.log(finalResult);
