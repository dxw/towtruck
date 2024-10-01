import Database from "better-sqlite3";

const dbSchemaSql = [
  `CREATE TABLE IF NOT EXISTS towtruck_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB,
    UNIQUE (scope, name, key)
  );`
];

const initialiseDatabase = (filename, options) => {
  const db = new Database(filename, options);
  db.pragma('journal_mode = WAL');

  const dbSchemaStatements = dbSchemaSql.map((sql) => db.prepare(sql));

  db.transaction(() => {
    dbSchemaStatements.forEach((statement) => statement.run());
  })();

  return db;
}

export class TowtruckDatabase {
  #db;

  #saveStatement;
  #getStatement;
  #getAllForNameStatement;
  #getAllForScopeStatement;

  constructor(filename = "./data/towtruck.db", options) {
    this.#db = initialiseDatabase(filename, options);

    this.#saveStatement = this.#db.prepare("INSERT INTO towtruck_data (scope, name, key, value) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET value = excluded.value;");
    this.#getStatement = this.#db.prepare("SELECT value FROM towtruck_data WHERE scope = ? AND name = ? AND key = ?;");
    this.#getAllForNameStatement = this.#db.prepare("SELECT key, value FROM towtruck_data WHERE scope = ? AND name = ?;");
    this.#getAllForScopeStatement = this.#db.prepare("SELECT name, key, value FROM towtruck_data WHERE scope = ?;");
  }

  #save(scope, name, key, data) {
    return this.#saveStatement.run(scope, name, key, JSON.stringify(data));
  }

  #get(scope, name, key) {
    const json = this.#getStatement.get(scope, name, key)?.value;

    if (json) return JSON.parse(json);
  }

  #getAllForName(scope, name) {
    const rows = this.#getAllForNameStatement.all(scope, name);

    const result = {};
    rows.forEach((row) => result[row.key] = JSON.parse(row.value));

    return result;
  }

  #getAllForScope(scope) {
    const rows = this.#getAllForScopeStatement.all(scope);

    const result = {};
    rows.forEach((row) => {
      if (!result[row.name]) {
        result[row.name] = {};
      }

      result[row.name][row.key] = JSON.parse(row.value);
    });

    return result;
  }

  saveToRepository(name, key, data) {
    return this.#save("repository", name, key, data);
  }

  getFromRepository(name, key) {
    return this.#get("repository", name, key);
  }

  getAllFromRepository(name) {
    return this.#getAllForName("repository", name);
  }

  getAllRepositories() {
    return this.#getAllForScope("repository");
  }

  saveToDependency(name, key, data) {
    return this.#save("dependency", name, key, data);
  }

  getFromDependency(name, key) {
    return this.#get("dependency", name, key);
  }

  getAllFromDependency(name) {
    return this.#getAllForName("dependency", name);
  }

  getAllDependencies() {
    return this.#getAllForScope("dependency");
  }

  transaction(fn) {
    return this.#db.transaction(fn);
  }
};
