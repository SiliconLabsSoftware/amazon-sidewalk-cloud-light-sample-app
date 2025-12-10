export const validatePassword = (authHeader: string | undefined): boolean => {
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return match[1] === process.env.FRONTEND_PASSWORD;
};
