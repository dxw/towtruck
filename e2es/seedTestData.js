import { copyFile, mkdir, unlink } from "fs/promises";

export const createDestinationDirectory = async () => {
  console.info("Creating destination directory...");
  await mkdir("./data", { recursive: true });
};

export const seedTestData = async () => {
  console.info("Seeding test data...");
  // Remove any stale WAL/SHM journal files that would corrupt the copied database
  await Promise.allSettled([
    unlink("./data/towtruck.db-shm"),
    unlink("./data/towtruck.db-wal"),
  ]);
  await copyFile("./e2es/testData/towtruck.db", "./data/towtruck.db");
};

await createDestinationDirectory();
await seedTestData();
