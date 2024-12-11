import { InferInput } from "valibot";
import { TaskConnector } from "./connector";
import { CSV_To_Json, Json_To_CSV } from "./csv_tools";

const Funny_CSV_JSON_Util = TaskConnector.pipe([
  [
    Json_To_CSV,
    CSV_To_Json,
    async (input): Promise<InferInput<(typeof CSV_To_Json)[0]["input"]>> => {
      return {
        value: input.value,
        delimiter: input.delimiter,
      };
    },
  ],
]);

// Run the resulting task
const [CSVConverterSchema, CSVConverter] = Funny_CSV_JSON_Util;
const finalResult = await CSVConverter({
  value: [
    { name: "1000", config: { logging: false } },
    { name: "1001", config: { logging: false }, lol: "hehe" },
    { stuff: BigInt(9007199254740991) },
    { stuff: false },
  ],
  config: { logging: false },
});

console.log(finalResult.type === "success" ? finalResult.data.value : finalResult.error);
