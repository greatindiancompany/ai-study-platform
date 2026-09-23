import { supabase } from '../utils/supabaseClient.js';
import jwt from 'jsonwebtoken';
import { JWT_VERIFY_OPTIONS } from '../utils/jwtOptions.js';

// JWT_SECRET is validated at startup in server.js
const JWT_SECRET = process.env.JWT_SECRET;

export async function resolveBearerUser(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      body: { error: 'No authorization token provided' }
    };
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT token. Pin HS256 so alg=none and asymmetric tokens are rejected.
    const decoded = jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS);

    // Get user from database
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, created_at')
      .eq('id', decoded.userId)
      .limit(1);

    if (error || !users || users.length === 0) {
      return {
        ok: false,
        status: 401,
        body: { error: 'Invalid or expired token' }
      };
    }

    return { ok: true, user: users[0] };
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return { ok: false, status: 401, body: { error: 'Invalid token' } };
    }

    if (error.name === 'TokenExpiredError') {
      return { ok: false, status: 401, body: { error: 'Token expired' } };
    }

    return {
      ok: false,
      status: 401,
      body: { error: 'Authentication failed' }
    };
  }
}

export async function authenticateUser(req, res, next) {
  const result = await resolveBearerUser(req);
  if (!result.ok) {
    return res.status(result.status).json(result.body);
  }

  req.user = result.user;
  next();
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS);

        const { data: users } = await supabase
          .from('users')
          .select('id, username, created_at')
          .eq('id', decoded.userId)
          .limit(1);

        if (users && users.length > 0) {
          req.user = users[0];
        }
      } catch (error) {
        // Continue without authentication if token is invalid
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
