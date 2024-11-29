import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resource } from "sst";
import { Cfg } from "./configurator";
import { Users } from "./users";

Cfg.Configurator.loadObject({
  home: "aws",
  environment:
    Resource.App.stage === "production" ? "production" : Resource.App.stage === "staging" ? "staging" : "development",
  storage: {
    type: "s3",
    name: Resource.MainAWSStorage.name,
  },
});

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at: ", p, "reason:", reason);
});

const parseCommandLineArguments = () => {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === "--") {
      break;
    }
    options[args[i]] = args[i + 1];
  }
  return options;
};

const main = async () => {
  const options = parseCommandLineArguments();
  const fromJson = options["--from-json"];
  if ("--from-json" in options && fromJson) {
    const path = join(process.cwd(), fromJson);
    const json = readFileSync(path, "utf-8");
    const data = JSON.parse(json);

    await Users.seed(data);
    process.exit(0);
  }
  await Users.seed();

  process.exit(0);
};

await main();
