export class Dependency {
  constructor(name, version) {
    this.name = name;
    this.version = version;
  }
}

// Matches CR LF or CR or LF.
const LINE_SEPARATOR_REGEX = /\r?\n|\r|\n/g;

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

const issueIsRenovateDependencyDashboard = (issue) => issue.user.login === "renovate[bot]" && issue.pull_request === undefined;

const parseDependenciesFromDashboard = (issue) => issue
  .body
  .split(LINE_SEPARATOR_REGEX)
  .map(parseDependencyFromLine)
  .filter((dependency) => dependency !== null);

const parseDependencyFromLine = (line) => {
  const match = line.match(DEPENDENCY_NAME_AND_VERSION_REGEX);

  if (match === null) {
    return null;
  }

  return new Dependency(match[1], match[2]);
}

export const handleIssuesApiResponse = (response) => {
  const dependencyDashboardIssue = response.data.find(issueIsRenovateDependencyDashboard);

  if (!dependencyDashboardIssue) {
    return [];
  }

  return parseDependenciesFromDashboard(dependencyDashboardIssue);
}

export const getDependenciesForRepo = ({ octokit }, repo) => {
  return octokit
    .request(repo.issuesUrl)
    .then(handleIssuesApiResponse);
}
