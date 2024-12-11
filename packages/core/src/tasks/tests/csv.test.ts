import { describe, expect, test } from "bun:test";
import { csv_to_json, json_to_csv } from "../csv_tools";

const DEFAULT_DELIMITER = ",";

describe("JSON to CSV and back conversion", () => {
  test("should convert a simple object to CSV and back", async () => {
    const input = [{ name: "John", age: 30 }];
    const csvResult = await json_to_csv({ value: input, delimiter: DEFAULT_DELIMITER });
    expect(csvResult.type).toBe("success");
    if (csvResult.type !== "success") {
      return;
    }
    const csv = csvResult.data;
    expect(csv.value).toBe("name,age\nJohn,30");
    const jsonResult = await csv_to_json({ value: csv.value, delimiter: DEFAULT_DELIMITER });
    expect(jsonResult.type).toBe("success");
    if (jsonResult.type !== "success") return;
    expect(jsonResult.data).toEqual({ value: input, delimiter: DEFAULT_DELIMITER });
  });

  test("should handle nested objects", async () => {
    const input = [
      {
        name: "John",
        address: {
          street: "123 Main St",
          city: "New York",
        },
      },
    ];
    const csvResult = await json_to_csv({ value: input, delimiter: DEFAULT_DELIMITER });
    expect(csvResult.type).toBe("success");
    if (csvResult.type !== "success") {
      return;
    }
    const csv = csvResult.data;
    expect(csv.value).toBe("name,address.street,address.city\nJohn,123 Main St,New York");
    const jsonResult = await csv_to_json({ value: csv.value, delimiter: DEFAULT_DELIMITER });
    expect(jsonResult.type).toBe("success");
    if (jsonResult.type !== "success") return;
    expect(jsonResult.data).toEqual({ value: input, delimiter: DEFAULT_DELIMITER });
  });

  test("should handle arrays", async () => {
    const input = [{ name: "John", hobbies: ["reading", "swimming"] }];
    const csvResult = await json_to_csv({ value: input, delimiter: DEFAULT_DELIMITER });
    expect(csvResult.type).toBe("success");
    if (csvResult.type !== "success") {
      return;
    }
    const csv = csvResult.data;
    expect(csv.value).toBe('name,hobbies\nJohn,"[""reading"",""swimming""]"');
    const jsonResult = await csv_to_json({ value: csv.value, delimiter: DEFAULT_DELIMITER });
    expect(jsonResult.type).toBe("success");
    if (jsonResult.type !== "success") return;
    expect(jsonResult.data).toEqual({ value: input, delimiter: DEFAULT_DELIMITER });
  });

  test("should handle mixed nested objects and arrays", async () => {
    const input = [
      {
        name: "John",
        age: 30,
        address: {
          street: "123 Main St",
          city: "New York",
        },
        hobbies: ["reading", "swimming"],
        education: [
          { degree: "Bachelor's", year: 2010 },
          { degree: "Master's", year: 2012 },
        ],
      },
    ];
    const csvResult = await json_to_csv({ value: input, delimiter: DEFAULT_DELIMITER });
    expect(csvResult.type).toBe("success");
    if (csvResult.type !== "success") {
      return;
    }
    const csv = csvResult.data;
    const expectedCsv =
      'name,age,address.street,address.city,hobbies,education\nJohn,30,123 Main St,New York,"[""reading"",""swimming""]","[{""degree"":""Bachelor\'s"",""year"":2010},{""degree"":""Master\'s"",""year"":2012}]"';
    expect(csv.value).toBe(expectedCsv);
    const jsonResult = await csv_to_json({ value: csv.value, delimiter: DEFAULT_DELIMITER });
    expect(jsonResult.type).toBe("success");
    if (jsonResult.type !== "success") return;
    expect(jsonResult.data).toEqual({ value: input, delimiter: DEFAULT_DELIMITER });
  });

  test("should handle empty values", async () => {
    const input = [{ name: "John", age: null, city: "" }];
    const csvResult = await json_to_csv({ value: input, delimiter: DEFAULT_DELIMITER });
    expect(csvResult.type).toBe("success");
    if (csvResult.type !== "success") {
      return;
    }
    const csv = csvResult.data;
    expect(csv.value).toBe("name,age,city\nJohn,null,");
    const jsonResult = await csv_to_json({ value: csv.value, delimiter: DEFAULT_DELIMITER });
    expect(jsonResult.type).toBe("success");
    if (jsonResult.type !== "success") return;
    expect(jsonResult.data).toEqual({ value: input, delimiter: DEFAULT_DELIMITER });
  });

  test("should handle undefined values", async () => {
    const input = [{ name: "John", age: undefined, city: "" }];
    const csvResult = await json_to_csv({ value: input, delimiter: DEFAULT_DELIMITER });
    expect(csvResult.type).toBe("success");
    if (csvResult.type !== "success") {
      return;
    }
    const csv = csvResult.data;
    expect(csv.value).toBe("name,age,city\nJohn,undefined,");
    const jsonResult = await csv_to_json({ value: csv.value, delimiter: DEFAULT_DELIMITER });
    expect(jsonResult.type).toBe("success");
    if (jsonResult.type !== "success") return;
    expect(jsonResult.data).toEqual({ value: input, delimiter: DEFAULT_DELIMITER });
  });

  test("should handle special characters in values", async () => {
    const input = [{ name: "John, Doe", description: "Line 1\nLine 2" }];
    const csvResult = await json_to_csv({ value: input });
    expect(csvResult.type).toBe("success");
    if (csvResult.type !== "success") {
      return;
    }
    const csv = csvResult.data;
    expect(csv.value).toBe('name,description\n"John, Doe","Line 1\nLine 2"');
    const jsonResult = await csv_to_json({ value: csv.value, delimiter: DEFAULT_DELIMITER });
    expect(jsonResult.type).toBe("success");
    if (jsonResult.type !== "success") return;
    expect(jsonResult.data).toEqual({ value: input, delimiter: DEFAULT_DELIMITER });
  });
});
