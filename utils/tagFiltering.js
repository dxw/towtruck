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

  return repos.filter((repo) => Array.isArray(repo.topics) && selectedTags.some((tag) => repo.topics.includes(tag)));
};

