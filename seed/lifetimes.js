import { TowtruckDatabase } from "../db/index.js";
import {
  fetchAllDependencyLifetimes,
  saveAllDependencyLifetimes,
} from "../utils/endOfLifeDateApi/fetchAllDependencyEolInfo.js";
import { EndOfLifeDateApiClient } from "../utils/endOfLifeDateApi/index.js";

const seed = async () => {
  const db = new TowtruckDatabase();
  const persistedRepoData = db.getAllRepositories();

  const dependencySet = new Set();
  Object.entries(persistedRepoData)
    .flatMap(([, repo]) => repo.dependencies)
    .forEach((dependency) => dependencySet.add(dependency.name));

  const allLifetimes = await fetchAllDependencyLifetimes(
    dependencySet,
    new EndOfLifeDateApiClient(),
  );
  await saveAllDependencyLifetimes(allLifetimes, db);
};

await seed();
