import crypto from 'crypto';

export const AI_SERVER_SECRET_HEADER = 'x-ai-server-secret';
const MIN_SECRET_LENGTH = 32;

export function configuredServerSecret() {
  const secret = process.env.AI_SERVER_SECRET;
  if (typeof secret !== 'string') return null;
  if (secret.length < MIN_SECRET_LENGTH) return null;
  return secret;
}

export function serverSecretMatches(provided) {
  const configured = configuredServerSecret();
  if (!configured || typeof provided !== 'string' || provided.length === 0) {
    return false;
  }

  const providedBuf = Buffer.from(provided);
  const configuredBuf = Buffer.from(configured);
  if (providedBuf.length !== configuredBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, configuredBuf);
}

export function requestHasServerSecret(req) {
  return serverSecretMatches(req.get(AI_SERVER_SECRET_HEADER));
}

export function denyWithoutServerSecret(req, res, error) {
  if (requestHasServerSecret(req)) return false;
  res.status(403).json({ error });
  return true;
}
