import { afterEach, beforeEach, describe, it } from "node:test";
import expect from "node:assert";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const rootDir = join(import.meta.dirname, "..");

const runSeedTestData = (env) =>
  execFileSync("node", ["e2es/seedTestData.js"], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    stdio: "pipe",
  });

describe("seedTestData", () => {
  let tempDir;
  let dbPath;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "towtruck-"));
    dbPath = join(tempDir, "nested", "e2e.db");
  });

  afterEach(async () => await rm(tempDir, { recursive: true, force: true }));

  it("refuses to run without DB_PATH", () => {
    expect.throws(() => runSeedTestData({ DB_PATH: "" }), /DB_PATH must be set/);
  });

  it("copies the test data to DB_PATH", () => {
    runSeedTestData({ DB_PATH: dbPath });

    expect.deepStrictEqual(readFileSync(dbPath), readFileSync(join(rootDir, "e2es/testData/towtruck.db")));
  });

  it("removes stale WAL and SHM files", () => {
    runSeedTestData({ DB_PATH: dbPath });
    writeFileSync(`${dbPath}-wal`, "stale");
    writeFileSync(`${dbPath}-shm`, "stale");

    runSeedTestData({ DB_PATH: dbPath });

    expect.strictEqual(existsSync(`${dbPath}-wal`), false);
    expect.strictEqual(existsSync(`${dbPath}-shm`), false);
  });
});
