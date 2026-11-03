// GitHub topics must start with a letter or number, so this can never clash with a real tag.
export const UNTAGGED = "_untagged";

const hasNoTags = (repo) => !Array.isArray(repo.topics) || repo.topics.length === 0;

export const normalizeSelectedTags = (tagParam) => {
  const rawTags = Array.isArray(tagParam)
    ? tagParam
    : typeof tagParam === "string"
      ? tagParam.split(",")
      : [];

  return [...new Set(rawTags.map((tag) => tag.trim()).filter(Boolean))];
};

export const filterByTags = (repos, selectedTags) => {
  if (!selectedTags.length) {
    return repos;
  }

  return repos.filter((repo) => selectedTags.some((tag) =>
    tag === UNTAGGED ? hasNoTags(repo) : Array.isArray(repo.topics) && repo.topics.includes(tag)
  ));
};

export const excludeByTag = (repos, tag) => {
  return repos.filter((repo) => !Array.isArray(repo.topics) || !repo.topics.includes(tag));
};

