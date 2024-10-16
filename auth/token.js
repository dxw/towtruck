export const parseToken = (request) => {
  const match = request.headers?.cookie?.match(/Token=([^;]*)/);
  return match?.[1];
};

export const isTokenValid = async (app, token) => {
  try {
    const { data: { app: { client_id }, created_at, expires_at }, authentication } = await app.oauth.checkToken({ token });

    const now = new Date();
    return client_id === authentication.clientId && new Date(created_at) < now && new Date(expires_at) > now;
  } catch {
    return false;
  }
};
