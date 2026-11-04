import { describe, it } from "node:test";
import expect from "node:assert";
import { isPushToDefaultBranch } from "./isPushToDefaultBranch.js";

describe("isPushToDefaultBranch", () => {
  it("returns true for a push to a default branch called main", () => {
    const payload = { ref: "refs/heads/main", repository: { default_branch: "main" } };

    expect.strictEqual(isPushToDefaultBranch(payload), true);
  });

  it("returns true for a push to a default branch with another name", () => {
    const payload = { ref: "refs/heads/master", repository: { default_branch: "master" } };

    expect.strictEqual(isPushToDefaultBranch(payload), true);
  });

  it("returns false for a push to main when it is not the default branch", () => {
    const payload = { ref: "refs/heads/main", repository: { default_branch: "develop" } };

    expect.strictEqual(isPushToDefaultBranch(payload), false);
  });

  it("returns false for a push to a non-default branch", () => {
    const payload = { ref: "refs/heads/feature/foo", repository: { default_branch: "main" } };

    expect.strictEqual(isPushToDefaultBranch(payload), false);
  });

  it("returns false for a tag with the same name as the default branch", () => {
    const payload = { ref: "refs/tags/main", repository: { default_branch: "main" } };

    expect.strictEqual(isPushToDefaultBranch(payload), false);
  });
});
