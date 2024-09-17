import { copyFile, mkdir } from "fs/promises";

export const createDestinationDirectory = async () => {
  console.info("Creating destination directory...");
  await mkdir("./data", { recursive: true });
};

export const seedTestData = async () => {
  console.info("Seeding test data...");
  await Promise.all([
    copyFile("./e2es/testData/repos.json", "./data/repos.json"),
    copyFile("./e2es/testData/lifetimes.json", "./data/lifetimes.json"),
  ]);
};

await createDestinationDirectory();
await seedTestData();
