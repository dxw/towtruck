import { TowtruckDatabase } from "../db/index.js";
import {
  fetchAllDependencyLifetimes,
  saveAllDependencyLifetimes,
} from "../utils/endOfLifeDateApi/fetchAllDependencyEolInfo.js";
import { EndOfLifeDateApiClient } from "../utils/endOfLifeDateApi/index.js";

const seed = async () => {
  const db = new TowtruckDatabase();

  db.deleteAllDependencies();

  const allLifetimes = await fetchAllDependencyLifetimes(
    db,
    new EndOfLifeDateApiClient(),
  );
  await saveAllDependencyLifetimes(allLifetimes, db);
};

await seed();
