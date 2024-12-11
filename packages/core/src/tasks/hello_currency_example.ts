import { InferInput } from "valibot";
import { TaskConnector } from "./connector";
import { Exchange } from "./currency_exchange";
import { HelloWorld } from "./hello_world";

const Funny_HelloWorld_CurrencyExchanger = TaskConnector.pipe([
  [
    HelloWorld,
    Exchange,
    async (input): Promise<InferInput<(typeof Exchange)[0]["input"]>> => {
      const value = Number(input.hello);

      if (Number.isNaN(value)) {
        throw new Error("Invalid input");
      }

      return {
        value,
        date: "latest",
        from: "eur",
        to: ["usd", "chf"],
        config: {
          logging: true,
        },
      };
    },
  ],
]);

// Run the resulting task
const [HelloWorldCurrencyExchangerSchema, HelloWorldCurrencyExchangeRunner] = Funny_HelloWorld_CurrencyExchanger;
const finalResult = await HelloWorldCurrencyExchangeRunner({ name: "1000", config: { logging: true } });
console.log(finalResult);
