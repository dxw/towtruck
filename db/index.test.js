import { afterEach, before, describe, it } from "node:test";
import expect from "node:assert";
import { TowtruckDatabase } from "./index.js";
import { mkdir, unlink } from "node:fs/promises";
import Database from "better-sqlite3";
import { dirname } from "node:path";

const testDbPath = "./data/test.db";

const deleteFile = async (path) => {
  try {
    await unlink(path);
  } catch (e) {
    if (e.code === "ENOENT") {
      return;
    }

    throw e;
  }
}

describe("TowtruckDatabase", () => {
  before(async () => await mkdir(dirname(testDbPath), { recursive: true }));

  afterEach(async () => {
    await Promise.all([
      deleteFile(testDbPath),
      deleteFile(`${testDbPath}-wal`),
      deleteFile(`${testDbPath}-shm`),
    ]);
  });

  describe("constructor", () => {
    it("ensures database is set up correctly", () => {
      const log = [];
      new TowtruckDatabase(testDbPath, { verbose: (str) => log.push(str)});

      expect(log.find(str => str === "PRAGMA journal_mode = WAL"), "Journal mode should be set to WAL.");
      expect(log.find(str => str.includes("CREATE TABLE IF NOT EXISTS towtruck_data")), "A `towtruck_data` table schema should be defined.");
    });
  });

  describe("saveToRepository", () => {
    it("inserts the expected data into the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const data = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const expected = {
        id: 1,
        scope: "repository",
        name: "test-repo",
        key: "some-data",
        value: JSON.stringify(data),
      };

      const result = db.saveToRepository("test-repo", "some-data", data);
      const actual = new Database(testDbPath).prepare("SELECT * FROM towtruck_data WHERE ROWID = ?;").get(result.lastInsertRowid);

      expect.deepStrictEqual(actual, expected);
    });

    it("updates the row if the data already exists", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");
      const original = insertStatement.run("repository", "test-repo", "some-data", JSON.stringify({}));

      const data = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const expected = {
        id: 1,
        scope: "repository",
        name: "test-repo",
        key: "some-data",
        value: JSON.stringify(data),
      };

      db.saveToRepository("test-repo", "some-data", data);
      const actual = new Database(testDbPath).prepare("SELECT * FROM towtruck_data WHERE ROWID = ?;").get(original.lastInsertRowid);

      expect.deepStrictEqual(actual, expected);
    });
  });

  describe("getFromRepository", () => {
    it("retrieves the expected data from the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");

      const expected = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      insertStatement.run("repository", "test-repo", "some-data", JSON.stringify(expected));
      insertStatement.run("repository", "test-repo", "some-other-data", JSON.stringify({}));
      insertStatement.run("repository", "another-repo", "some-data", JSON.stringify({}));
      insertStatement.run("dependency", "test-dependency", "some-data", JSON.stringify({}));

      const actual = db.getFromRepository("test-repo", "some-data");

      expect.deepStrictEqual(actual, expected);
    });

    it("returns undefined when the given key doesn't exist", () => {
      const db = new TowtruckDatabase(testDbPath);

      const actual = db.getFromRepository("test-repo", "some-data");

      expect.strictEqual(actual, undefined);
    });
  });

  describe("getAllFromRepository", () => {
    it("retrieves the expected data from the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");

      const someData = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const someOtherData = {
        foo: "bar",
        baz: false,
        quux: 0.123456789,
      };

      const expected = {
        "some-data": someData,
        "some-other-data": someOtherData,
      };

      insertStatement.run("repository", "test-repo", "some-data", JSON.stringify(someData));
      insertStatement.run("repository", "test-repo", "some-other-data", JSON.stringify(someOtherData));
      insertStatement.run("repository", "another-repo", "some-data", JSON.stringify({}));
      insertStatement.run("dependency", "test-dependency", "some-data", JSON.stringify({}));

      const actual = db.getAllFromRepository("test-repo");

      expect.deepStrictEqual(actual, expected);
    });

    it("returns an empty object when the given repository doesn't exist", () => {
      const db = new TowtruckDatabase(testDbPath);

      const actual = db.getAllFromRepository("test-repo");

      expect.deepStrictEqual(actual, {});
    });
  });

  describe("getAllRepositories", () => {
    it("retrieves the expected data from the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");

      const testRepoSomeData = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const testRepoSomeOtherData = {
        foo: "bar",
        baz: false,
        quux: 0.123456789,
      };

      const anotherRepoSomeData = [1, "foo", true, null];

      const expected = {
        "test-repo": {
          "some-data": testRepoSomeData,
          "some-other-data": testRepoSomeOtherData,
        },
        "another-repo": {
          "some-data": anotherRepoSomeData,
        },
      };

      insertStatement.run("repository", "test-repo", "some-data", JSON.stringify(testRepoSomeData));
      insertStatement.run("repository", "test-repo", "some-other-data", JSON.stringify(testRepoSomeOtherData));
      insertStatement.run("repository", "another-repo", "some-data", JSON.stringify(anotherRepoSomeData));
      insertStatement.run("dependency", "test-dependency", "some-data", JSON.stringify({}));

      const actual = db.getAllRepositories();

      expect.deepStrictEqual(actual, expected);
    });

    it("returns an empty object when no repositories exist", () => {
      const db = new TowtruckDatabase(testDbPath);

      const actual = db.getAllRepositories();

      expect.deepStrictEqual(actual, {});
    });
  });

  describe("saveToDependency", () => {
    it("inserts the expected data into the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const data = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const expected = {
        id: 1,
        scope: "dependency",
        name: "test-dep",
        key: "some-data",
        value: JSON.stringify(data),
      };

      const result = db.saveToDependency("test-dep", "some-data", data);
      const actual = new Database(testDbPath).prepare("SELECT * FROM towtruck_data WHERE ROWID = ?;").get(result.lastInsertRowid);

      expect.deepStrictEqual(actual, expected);
    });

    it("updates the row if the data already exists", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");
      const original = insertStatement.run("dependency", "test-dep", "some-data", JSON.stringify({}));

      const data = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const expected = {
        id: 1,
        scope: "dependency",
        name: "test-dep",
        key: "some-data",
        value: JSON.stringify(data),
      };

      db.saveToDependency("test-dep", "some-data", data);
      const actual = new Database(testDbPath).prepare("SELECT * FROM towtruck_data WHERE ROWID = ?;").get(original.lastInsertRowid);

      expect.deepStrictEqual(actual, expected);
    });
  });

  describe("getFromDependency", () => {
    it("retrieves the expected data from the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");

      const expected = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      insertStatement.run("dependency", "test-dep", "some-data", JSON.stringify(expected));
      insertStatement.run("dependency", "test-dep", "some-other-data", JSON.stringify({}));
      insertStatement.run("dependency", "another-dep", "some-data", JSON.stringify({}));
      insertStatement.run("repository", "test-repo", "some-data", JSON.stringify({}));

      const actual = db.getFromDependency("test-dep", "some-data");

      expect.deepStrictEqual(actual, expected);
    });

    it("returns undefined when the given key doesn't exist", () => {
      const db = new TowtruckDatabase(testDbPath);

      const actual = db.getFromDependency("test-dep", "some-data");

      expect.strictEqual(actual, undefined);
    });
  });

  describe("getAllFromDependency", () => {
    it("retrieves the expected data from the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");

      const someData = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const someOtherData = {
        foo: "bar",
        baz: false,
        quux: 0.123456789,
      };

      const expected = {
        "some-data": someData,
        "some-other-data": someOtherData,
      };

      insertStatement.run("dependency", "test-dep", "some-data", JSON.stringify(someData));
      insertStatement.run("dependency", "test-dep", "some-other-data", JSON.stringify(someOtherData));
      insertStatement.run("dependency", "another-dep", "some-data", JSON.stringify({}));
      insertStatement.run("repository", "test-repository", "some-data", JSON.stringify({}));

      const actual = db.getAllFromDependency("test-dep");

      expect.deepStrictEqual(actual, expected);
    });

    it("returns an empty object when the given dependency doesn't exist", () => {
      const db = new TowtruckDatabase(testDbPath);

      const actual = db.getAllFromDependency("test-dep");

      expect.deepStrictEqual(actual, {});
    });
  });

  describe("getAllDependencies", () => {
    it("retrieves the expected data from the table", () => {
      const db = new TowtruckDatabase(testDbPath);

      const insertStatement = new Database(testDbPath).prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?);");

      const testDepSomeData = {
        array: [1, 2, 3],
        text: "Text",
        object: {
          boolean: true,
          missing: null,
        },
      };

      const testDepSomeOtherData = {
        foo: "bar",
        baz: false,
        quux: 0.123456789,
      };

      const anotherDepSomeData = [1, "foo", true, null];

      const expected = {
        "test-dep": {
          "some-data": testDepSomeData,
          "some-other-data": testDepSomeOtherData,
        },
        "another-dep": {
          "some-data": anotherDepSomeData,
        },
      };

      insertStatement.run("dependency", "test-dep", "some-data", JSON.stringify(testDepSomeData));
      insertStatement.run("dependency", "test-dep", "some-other-data", JSON.stringify(testDepSomeOtherData));
      insertStatement.run("dependency", "another-dep", "some-data", JSON.stringify(anotherDepSomeData));
      insertStatement.run("repository", "test-repository", "some-data", JSON.stringify({}));

      const actual = db.getAllDependencies();

      expect.deepStrictEqual(actual, expected);
    });

    it("returns an empty object when no dependencies exist", () => {
      const db = new TowtruckDatabase(testDbPath);

      const actual = db.getAllDependencies();

      expect.deepStrictEqual(actual, {});
    });
  });
});
