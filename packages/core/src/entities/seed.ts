import { Organizations } from "./organizations";
import { Users } from "./users";

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at: ", p, "reason:", reason);
});

const main = async () => {
  await Users.seed();

  process.exit(0);
};

await main();
