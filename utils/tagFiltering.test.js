import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeSelectedTags, filterByTags } from "./tagFiltering.js";

describe("normalizeSelectedTags", () => {
  it("returns an empty array when no tags are provided", () => {
	assert.deepStrictEqual(normalizeSelectedTags(undefined), []);
  });

  it("splits comma-separated tags", () => {
	assert.deepStrictEqual(normalizeSelectedTags("govpress,delivery-plus"), ["govpress", "delivery-plus"]);
  });

  it("trims whitespace and removes empty tags", () => {
	assert.deepStrictEqual(normalizeSelectedTags("govpress, , delivery-plus ,"), ["govpress", "delivery-plus"]);
  });

  it("deduplicates tags", () => {
	assert.deepStrictEqual(normalizeSelectedTags("govpress,govpress,delivery-plus"), ["govpress", "delivery-plus"]);
  });

  it("supports repeated query param arrays", () => {
	assert.deepStrictEqual(normalizeSelectedTags(["govpress", "delivery-plus"]), ["govpress", "delivery-plus"]);
  });
});

describe("filterByTags", () => {
  const repos = [
	{ name: "repo-1", topics: ["govpress", "alpha"] },
	{ name: "repo-2", topics: ["delivery-plus"] },
	{ name: "repo-3", topics: ["alpha"] },
	{ name: "repo-4", topics: [] },
  ];

  it("returns all repos when no selected tags", () => {
	assert.deepStrictEqual(filterByTags(repos, []), repos);
  });

  it("returns repos matching any selected tag", () => {
	const result = filterByTags(repos, ["govpress", "delivery-plus"]);
	assert.deepStrictEqual(result.map((repo) => repo.name), ["repo-1", "repo-2"]);
  });

  it("ignores repos with no topics", () => {
	const result = filterByTags(repos, ["govpress"]);
	assert.deepStrictEqual(result.map((repo) => repo.name), ["repo-1"]);
  });
});

