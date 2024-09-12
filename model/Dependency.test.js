import { describe, it } from "node:test";
import expect from "node:assert";
import { Dependency } from "./Dependency.js";

const inputDependencies = [
  { name: "ruby", version: "3.3.5" },
  { name: "bootsnap", version: '">= 1.1.0"' },
  { name: "bootstrap", version: '">= 4.3.1"' },
  { name: "coffee-rails", version: '"~> 5.0"' },
  { name: "high_voltage", version: "undefined" },
  { name: "jbuilder", version: '"~> 2.11"' },
  { name: "turbolinks", version: '"~> 5"' },
  { name: "listen", version: '">= 3.0.5", "< 3.10"' },
  { name: "actions/checkout", version: "v3" },
  { name: "akhileshns/heroku-deploy", version: "v3.13.15" },
  { name: "@rollup/plugin-commonjs", version: "^25.0.0" },
  { name: "@rollup/plugin-node-resolve", version: "^15.0.1" },
  { name: "@rollup/plugin-terser", version: "^0.4.0" },
  { name: "node", version: "18.x" },
  { name: "npm", version: "8.x" },
  {
    name: "actions/checkout",
    version: "v4@692973e3d937129bcbf40652eb9f2f61becf3332",
  },
  { name: "babel-core", version: "v7.0.0-bridge.0" },
  { name: "ubuntu", version: "xenial" },
];

const expectedDependencies = [
  {
    name: "ruby",
    major: 3,
    minor: 3,
    patch: 5,
    tag: undefined,
    version: "3.3.5",
  },
  {
    name: "bootsnap",
    major: 1,
    minor: 1,
    patch: 0,
    tag: undefined,
    version: "1.1.0",
  },
  {
    name: "bootstrap",
    major: 4,
    minor: 3,
    patch: 1,
    tag: undefined,
    version: "4.3.1",
  },
  {
    name: "coffee-rails",
    major: 5,
    minor: 0,
    patch: undefined,
    tag: undefined,
    version: "5.0",
  },
  { name: "high_voltage" },
  {
    name: "jbuilder",
    major: 2,
    minor: 11,
    patch: undefined,
    tag: undefined,
    version: "2.11",
  },
  {
    name: "turbolinks",
    major: 5,
    minor: undefined,
    patch: undefined,
    tag: undefined,
    version: "5",
  },
  {
    name: "listen",
    major: 3,
    minor: 0,
    patch: 5,
    tag: undefined,
    version: "3.0.5",
  },
  {
    name: "actions/checkout",
    major: 3,
    minor: undefined,
    patch: undefined,
    tag: undefined,
    version: "3",
  },
  {
    name: "akhileshns/heroku-deploy",
    major: 3,
    minor: 13,
    patch: 15,
    tag: undefined,
    version: "3.13.15",
  },
  {
    name: "@rollup/plugin-commonjs",
    major: 25,
    minor: 0,
    patch: 0,
    tag: undefined,
    version: "25.0.0",
  },
  {
    name: "@rollup/plugin-node-resolve",
    major: 15,
    minor: 0,
    patch: 1,
    tag: undefined,
    version: "15.0.1",
  },
  {
    name: "@rollup/plugin-terser",
    major: 0,
    minor: 4,
    patch: 0,
    tag: undefined,
    version: "0.4.0",
  },
  {
    name: "node",
    major: 18,
    minor: undefined,
    patch: undefined,
    tag: undefined,
    version: "18",
  },
  {
    name: "npm",
    major: 8,
    minor: undefined,
    patch: undefined,
    tag: undefined,
    version: "8",
  },
  {
    name: "actions/checkout",
    major: 4,
    minor: undefined,
    patch: undefined,
    tag: "692973e3d937129bcbf40652eb9f2f61becf3332",
    version: "4",
  },
  {
    name: "babel-core",
    major: 7,
    minor: 0,
    patch: 0,
    tag: "bridge.0",
    version: "7.0.0",
  },
  { name: "ubuntu", tag: "xenial" },
];

describe("Dependency", () => {
  describe("constructor", () => {
    it("should set the name and version ", () => {
      for (const [input, expected] of inputDependencies.map((e, i) => [
        e,
        expectedDependencies[i],
      ])) {
        const result = new Dependency(input.name, input.version);

        expect.deepEqual(result, expected);
      }
    });
  });
});
