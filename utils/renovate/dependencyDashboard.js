import { Dependency } from "../../model/Dependency.js";

// Matches CR LF or CR or LF.
const LINE_SEPARATOR_REGEX = /\r?\n|\r|\n/g;

// Matches the part of the Dependency Dashboard body text between the header and the horizontal rule,
// without capturing the header or the horizontal rule itself.
//
// This will prevent false positives from being detected in the preamble.
const DETECTED_DEPENDENCIES_SECTION_REGEX = /(?<=## Detected dependencies)(.*)(?=---)/s;

// Matches text in backticks separated by a space.
// Group 1 is interpreted as the name, and group 2 the version.
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
const DEPENDENCY_NAME_AND_VERSION_REGEX = /`(\S+?) (.*)`/;

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
  return octokit.request(repository.issues_url).then(handleIssuesApiResponse);
};
