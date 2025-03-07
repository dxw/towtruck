import path from "path";

export const getAuthFile = (username) => {
  return path.join(import.meta.dirname, `../data/playwright/auth/${username}.json`);
};
