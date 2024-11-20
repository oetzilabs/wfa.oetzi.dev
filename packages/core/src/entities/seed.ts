import { Organizations } from "./organizations";
import { Users } from "./users";

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});

const main = async () => {
  console.log("Creating admin user and company");
  const adminUserExists = await Users.findByEmail("admin@wfa.oetzi.dev");
  if (!adminUserExists) {
    const adminUser = await Users.create({
      email: "admin@wfa.oetzi.dev",
      role: "admin",
      verifiedAt: new Date(),
      name: "Admin",
    });
    console.log("Admin user created");
    const adminCompanyExists = await Organizations.findByName("Taxi Kasse");

    if (!adminCompanyExists) {
      const adminCompany = await Organizations.create({
        email: "admin@wfa.oetzi.dev",
        ownerId: adminUser!.id,
        name: "Taxi Kasse",
        phoneNumber: "123456789",
        website: "https://wfa.oetzi.dev",
        base_charge: 0,
        distance_charge: 0,
        time_charge: 0,
      });
      console.log("Admin organization created");
    }
  }

  console.log("Creating test user and company");
  const testUserExists = await Users.findByEmail("testuser@wfa.oetzi.dev");

  if (!testUserExists) {
    const testUser = await Users.create({
      email: "testuser@wfa.oetzi.dev",
      role: "member",
      verifiedAt: new Date(),
      name: "Test",
    });
    console.log("Test user created");
    const testCompanyExists = await Organizations.findByName("Test Company");
    if (!testCompanyExists) {
      const testCompany = await Organizations.create({
        email: "testuser@wfa.oetzi.dev",
        ownerId: testUser!.id,
        name: "Test Company",
        phoneNumber: "123456789",
        website: "https://wfa.oetzi.dev",
        base_charge: 0,
        distance_charge: 0,
        time_charge: 0,
      });
      console.log("Test company created");
    }
  }

  process.exit(0);
};

await main();
