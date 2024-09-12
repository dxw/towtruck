// Matches semantic versions like:
// <major>
// <major>.<minor>
// <major>.<minor>.<patch>
// <major>.<minor>.<patch>-<tag>
// <major>.<minor>.<patch>@<tag>
//
// Examples:
//
// Version string: "~> 4.3"
// Group 1: 4
// Group 2: 3
// Group 3: <undefined>
// Group 4: <undefined>
//
// Version string: v4@44c2b7a8a4ea60a981eaca3cf939b5f4305c123b
// Group 1: 4
// Group 2: <undefined>
// Group 3: <undefined>
// Group 4: 44c2b7a8a4ea60a981eaca3cf939b5f4305c123b
//
// Version string: ^7.20.2
// Group 1: 7
// Group 2: 20
// Group 3: 2
// Group 4: <undefined>
//
// Version string: v7.0.0-bridge.0
// Group 1: 7
// Group 2: 0
// Group 3: 0
// Group 4: bridge.0
//
// Versions for which no semantic versions can be derived should be treated as an opaque tag.
const MAJOR_MINOR_PATCH_TAG_REGEX = /(\d+)(?:\.(\d+)(?:\.(\d+))?)?(?:[-@](\S+))?/;

export class Dependency {
  constructor(name, version) {
    this.name = name;

    if (!version || version === "undefined") {
      return;
    }

    const match = version.match(MAJOR_MINOR_PATCH_TAG_REGEX);

    if (match !== null) {
      this.major = match[1] && Number.parseInt(match[1]);
      this.minor = match[2] && Number.parseInt(match[2]);
      this.patch = match[3] && Number.parseInt(match[3]);
      this.tag = match[4];

      this.version = this.displayVersion;
    } else {
      this.tag = version;
    }
  }

  get displayVersion() {
    if (this.major === undefined) {
      return undefined;
    }

    let versionString = this.major.toString();

    if (this.minor !== undefined) {
      versionString += "." + this.minor.toString();

      if (this.patch !== undefined) {
        versionString += "." + this.patch.toString();
      }
    }

    return versionString;
  }
}
