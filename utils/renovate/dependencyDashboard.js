import { Dependency } from "../../model/Dependency.js";

// Matches CR LF or CR or LF.
const LINE_SEPARATOR_REGEX = /\r?\n|\r|\n/g;

// Matches the part of the Dependency Dashboard body text between the header and the horizontal rule,
// without capturing the header or the horizontal rule itself.
// Case-insensitive to handle both "Detected dependencies" and "Detected Dependencies".
//
// This will prevent false positives from being detected in the preamble.
const DETECTED_DEPENDENCIES_SECTION_REGEX = /(?<=## Detected [Dd]ependencies)(.*)(?=---)/s;

// Matches text in backticks separated by a space.
// Group 1 is interpreted as the name, and group 2 the version.
// The version capture stops before any backtick, and we strip trailing @sha suffixes.
// Examples:
//
// Line: " - `jekyll "~> 4.3.2"`"
// Group 1: jekyll
// Group 2: "~> 4.3.2"
//
// Line: " - `actions/checkout v4`"
// Group 1: actions/checkout
// Group 2: v4
//
// Line: "- `@babel/preset-env ^7.20.2`"
// Group 1: @babel/preset-env
// Group 2: ^7.20.2
//
// Line: " - `actions/checkout v7@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0`"
// Group 1: actions/checkout
// Group 2: v7
//
// Line: " - `node 24.18.0-slim@sha256:...`"
// Group 1: node
// Group 2: 24.18.0-slim
const DEPENDENCY_NAME_AND_VERSION_REGEX = /`(\S+?) ([^`@]+)(?:@[^`]*)?`/;

const issueIsRenovateDependencyDashboard = (issue) =>
  issue.user.login === "renovate[bot]" && issue.pull_request === undefined;

const getDetectedDependencies = (issue) => {
  const match = issue.body.match(DETECTED_DEPENDENCIES_SECTION_REGEX);

  if (match === null) {
    return null;
  }

  return match[0];
}

const parseDependenciesFromDashboard = (issue) =>
  getDetectedDependencies(issue)
    ?.split(LINE_SEPARATOR_REGEX)
    ?.map(parseDependencyFromLine)
    ?.filter((dependency) => dependency !== null)
    ?? [];

const parseDependencyFromLine = (line) => {
  const match = line.match(DEPENDENCY_NAME_AND_VERSION_REGEX);

  if (match === null) {
    return null;
  }

  return new Dependency(match[1], match[2]);
};

export const handleIssuesApiResponse = (response) => {
  const dependencyDashboardIssue = response.data.find(
    issueIsRenovateDependencyDashboard
  );

  if (!dependencyDashboardIssue) {
    return [];
  }

  return parseDependenciesFromDashboard(dependencyDashboardIssue);
};

export const getDependenciesForRepo = ({ octokit, repository }) => {
  const issuesUrl = repository.issues_url.replace("{/number}", "");
  return octokit.request(issuesUrl, {
    creator: "renovate[bot]",
    state: "open",
    per_page: 100,
  })
  .then(handleIssuesApiResponse)
  .catch((error) => {
    console.warn(`[${repository.name}] Dependencies: ${error.message}`);
    return [];
  });
};
