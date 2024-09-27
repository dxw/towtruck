import { copyFile, mkdir } from "fs/promises";

export const createDestinationDirectory = async () => {
  console.info("Creating destination directory...");
  await mkdir("./data", { recursive: true });
};

export const seedTestData = async () => {
  console.info("Seeding test data...");
  await Promise.all([
    copyFile("./e2es/testData/towtruck.db", "./data/towtruck.db"),
  ]);
};

await createDestinationDirectory();
await seedTestData();
