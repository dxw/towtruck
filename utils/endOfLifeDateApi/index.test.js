import { describe, it } from "node:test";
import expect from "node:assert";
import { getDependencyState } from "./index.js";
import { Dependency } from "../../model/Dependency.js";

describe("getDependencyState", () => {
  it("should return 'unknown' by default", () => {
    const dependency = new Dependency("ruby", "3.3.5");
    const cycles = [];

    const result = getDependencyState(dependency, cycles);

    expect.strictEqual(
      result,
      "unknown",
    );
  });

  it("should return 'endOfLife' when the dependency is for a cycle whose end-of-life date is in the past", () => {
    const dependency = new Dependency("ruby", "3.3.5");
    const cycles = [
      {
        cycle: "4",
        eol: "9999-01-01",
      },
      {
        cycle: "3",
        eol: "2024-01-01",
      },
    ];

    const result = getDependencyState(dependency, cycles);

    expect.strictEqual(
      result,
      "endOfLife",
    );
  });

  it("should return 'majorUpdateAvailable' when the dependency is for a cycle that's not the most recent cycle", () => {
    const dependency = new Dependency("ruby", "3.3.5");
    const cycles = [
      {
        cycle: "4",
        eol: "9999-01-01",
      },
      {
        cycle: "3",
        eol: "8888-01-01",
      },
    ];

    const result = getDependencyState(dependency, cycles);

    expect.strictEqual(
      result,
      "majorUpdateAvailable",
    );
  });

  it("should return 'minorUpdateAvailable' when the dependency is for the latest cycle but the latest version string does not match", () => {
    const dependency = new Dependency("ruby", "3.3.5");
    const cycles = [
      {
        cycle: "3",
        latest: "3.3.6",
        eol: "9999-01-01",
      },
      {
        cycle: "2",
        latest: "2.99.99",
        eol: "9999-01-01",
      }
    ];

    const result = getDependencyState(dependency, cycles);

    expect.strictEqual(
      result,
      "minorUpdateAvailable",
    );
  });

  it("should return 'upToDate' when the dependency is for the latest available version", () => {
    const dependency = new Dependency("ruby", "3.3.5");
    const cycles = [
      {
        cycle: "3",
        latest: "3.3.5",
        eol: "9999-01-01",
      },
      {
        cycle: "2",
        latest: "2.99.99",
        eol: "9999-01-01",
      }
    ];

    const result = getDependencyState(dependency, cycles);

    expect.strictEqual(
      result,
      "upToDate",
    );
  })
});
