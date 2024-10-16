
export const cookie = (key, value, path, expires) => {
  const cookieFragments = [`${key}=${value}`];

  if (path) {
    cookieFragments.push(`Path=${path}`);
  }

  if (expires) {
    cookieFragments.push(`Expires=${new Date(expires).toUTCString()}`);
  }

  return {
    "Set-Cookie": cookieFragments.join("; "),
  };
};
