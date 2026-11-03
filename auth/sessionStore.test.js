import { afterEach, before, describe, it } from "node:test";
import expect from "node:assert";
import { mkdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";
import { TowtruckDatabase } from "../db/index.js";
import { SqliteSessionStore } from "./sessionStore.js";

const testDbPath = "./data/session-store-test.db";

const deleteFile = async (path) => {
  try {
    await unlink(path);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
};

const buildStore = () => {
  const db = new TowtruckDatabase(testDbPath);
  const store = new SqliteSessionStore({ db });
  return {
    db,
    get: promisify(store.get.bind(store)),
    set: promisify(store.set.bind(store)),
    touch: promisify(store.touch.bind(store)),
    destroy: promisify(store.destroy.bind(store)),
  };
};

const inFuture = (ms) => new Date(Date.now() + ms).toISOString();

describe("SqliteSessionStore", () => {
  before(async () => await mkdir(dirname(testDbPath), { recursive: true }));

  afterEach(async () => {
    await Promise.all([deleteFile(testDbPath), deleteFile(`${testDbPath}-wal`), deleteFile(`${testDbPath}-shm`)]);
  });

  it("returns null for an unknown session", async () => {
    const store = buildStore();

    expect.strictEqual(await store.get("missing"), null);
  });

  it("persists a session that can be read by a new store instance", async () => {
    const sess = { cookie: { expires: inFuture(60_000) }, user: { email: "alice@dxw.com" } };
    await buildStore().set("sid-1", sess);

    expect.deepStrictEqual(await buildStore().get("sid-1"), sess);
  });

  it("returns null and removes an expired session", async () => {
    const store = buildStore();
    await store.set("sid-1", { cookie: { expires: inFuture(-1000) }, user: { email: "alice@dxw.com" } });

    expect.strictEqual(await store.get("sid-1"), null);
    expect.strictEqual(store.db.getSession("sid-1"), undefined);
  });

  it("uses a default expiry when the cookie has none", async () => {
    const store = buildStore();
    await store.set("sid-1", { cookie: {}, user: { email: "alice@dxw.com" } });

    const { expiresAt } = store.db.getSession("sid-1");
    expect.ok(expiresAt > Date.now());
  });

  it("extends the expiry on touch", async () => {
    const store = buildStore();
    await store.set("sid-1", { cookie: { expires: inFuture(1000) } });
    const before = store.db.getSession("sid-1").expiresAt;

    await store.touch("sid-1", { cookie: { expires: inFuture(60_000) } });

    expect.ok(store.db.getSession("sid-1").expiresAt > before);
  });

  it("destroys a session", async () => {
    const store = buildStore();
    await store.set("sid-1", { cookie: { expires: inFuture(60_000) } });

    await store.destroy("sid-1");

    expect.strictEqual(await store.get("sid-1"), null);
  });

  it("clears expired sessions on construction", () => {
    const db = new TowtruckDatabase(testDbPath);
    db.saveSession("expired", {}, Date.now() - 1000);

    new SqliteSessionStore({ db });

    expect.strictEqual(db.getSession("expired"), undefined);
  });
});
