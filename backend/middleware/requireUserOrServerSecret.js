import { resolveBearerUser } from './auth.js';
import { requestHasServerSecret } from './serverSecret.js';

function hasBearer(req) {
  const authHeader = req.headers.authorization;
  return typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
}

/**
 * Fail closed for routes that spend Anthropic quota.
 * A valid user JWT is enough. Otherwise a configured AI_SERVER_SECRET
 * (header x-ai-server-secret, at least 32 characters) is enough.
 * Missing credentials, a short or unset secret, and a bad token with no
 * matching secret are all rejected.
 */
export async function requireUserOrServerSecret(req, res, next) {
  if (hasBearer(req)) {
    const bearer = await resolveBearerUser(req);
    if (bearer.ok) {
      req.user = bearer.user;
      req.aiAccess = 'user';
      return next();
    }

    if (requestHasServerSecret(req)) {
      req.aiAccess = 'server-secret';
      return next();
    }

    return res.status(bearer.status).json(bearer.body);
  }

  if (requestHasServerSecret(req)) {
    req.aiAccess = 'server-secret';
    return next();
  }

  return res.status(401).json({ error: 'No authorization token provided' });
}
