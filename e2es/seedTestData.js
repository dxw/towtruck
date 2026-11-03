import { copyFile, mkdir, rm } from "fs/promises";
import { dirname } from "path";

const dbPath = process.env.DB_PATH;

if (!dbPath) {
  throw new Error("DB_PATH must be set so the test data doesn't overwrite another database.");
}

export const createDestinationDirectory = async () => {
  console.info("Creating destination directory...");
  await mkdir(dirname(dbPath), { recursive: true });
};

export const seedTestData = async () => {
  console.info("Seeding test data...");
  // Stale WAL files from a previous run would otherwise be replayed on top of the fresh copy.
  await Promise.all([
    rm(`${dbPath}-wal`, { force: true }),
    rm(`${dbPath}-shm`, { force: true }),
  ]);
  await copyFile("./e2es/testData/towtruck.db", dbPath);
};

await createDestinationDirectory();
await seedTestData();
