import { copyFile, mkdir } from "fs/promises";

export const createDestinationDirectory = async () => {
  console.info("Creating destination directory...");
  await mkdir("./data");
};

export const seedTestData = async () => {
  console.info("Seeding test data...");
  await copyFile("./e2es/testData/repos.json", "./data/repos.json");
};

await createDestinationDirectory();
await seedTestData();
