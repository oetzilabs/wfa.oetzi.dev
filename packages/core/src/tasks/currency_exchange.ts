import { array, date, literal, number, picklist, record, strictObject, variant } from "valibot";
import { TaskGenerator } from "./generator";

const currencies = picklist(["eur", "usd", "chf", "gbp"]);

export const [ExchangeSchema, exchange] = TaskGenerator.create({
  name: "currency-exchange",
  input: variant("date", [
    strictObject({
      date: date(),
      from: currencies,
      to: array(currencies),
      value: number(),
    }),
    strictObject({
      date: literal("latest"),
      from: currencies,
      to: array(currencies),
      value: number(),
    }),
  ]),
  output: record(currencies, number()),
  fn: async (input) => {
    let date: string = "latest";
    let dateFallback: string = "latest";
    if (input.date !== "latest") {
      date = `${input.date.getFullYear()}.${input.date.getMonth() + 1}.${input.date.getDate()}`;
      dateFallback = `${input.date.getFullYear()}-${input.date.getMonth() + 1}-${input.date.getDate()}`;
    }
    console.log(`Fetching data for ${input.from} to (${input.to.join(", ")}) on ${date}`);

    const url = `https://${dateFallback}.currency-api.pages.dev/v1/currencies/${input.from.toLowerCase()}.json`;
    const fallbackUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${input.from.toLowerCase()}.json`;
    let workingUrl = url;

    console.log(`Loading data from ${workingUrl}`);
    let response = await fetch(url);
    if (!response.ok) {
      workingUrl = fallbackUrl;
      console.log(`Loading data from ${workingUrl}`);
      response = await fetch(fallbackUrl);
    }
    if (!response.ok) {
      workingUrl = "failed:" + fallbackUrl;
      throw new Error("Could not fetch data");
    }
    const data = (await response.json()) as {
      date: string;
    } & { [name: string]: Record<string, number> };
    if (!data) {
      throw new Error("Could not fetch data");
    }
    const fromCheck = Object.hasOwn(data, input.from.toLowerCase());
    if (!fromCheck) {
      throw new Error("Could not find from currency");
    }
    const from = data[input.from.toLowerCase()];

    const result: Record<(typeof input.to)[number], number> = Object.create({});
    for (const to of input.to) {
      const toCheck = Object.hasOwn(from, to.toLowerCase());
      if (!toCheck) {
        throw new Error("Could not find to currency");
      }
      result[to] = from[to.toLowerCase()] * input.value;
    }
    result[input.from] = input.value;

    return result;
  },
});

const result = await exchange({
  date: "latest",
  from: "eur",
  to: ["usd", "chf"],
  value: 100,
});
console.log(result);
