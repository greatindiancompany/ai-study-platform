const PLACEHOLDERS = new Set([
  'your_anthropic_api_key_here',
  'your_supabase_project_url',
  'your_supabase_anon_key',
  'your_supabase_service_role_key',
  'replace_with_a_random_secret_at_least_32_characters_long',
  'your-secret-key-change-this-in-production',
]);

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPlaceholderSecret(value) {
  return present(value) && PLACEHOLDERS.has(value.trim());
}

/**
 * Fail closed before listen. Empty, short, and example-file values are rejected.
 * The anon key is not a substitute for the service-role key.
 */
export function assertRequiredSecrets(env = process.env) {
  const required = [
    'ANTHROPIC_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ];
  const missing = required.filter((name) => !present(env[name]));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }

  const placeholders = required.filter((name) => isPlaceholderSecret(env[name]));
  if (placeholders.length > 0) {
    return {
      ok: false,
      reason: `Refusing placeholder secrets: ${placeholders.join(', ')}`,
    };
  }

  if (!/^https:\/\//i.test(env.SUPABASE_URL.trim())) {
    return { ok: false, reason: 'SUPABASE_URL must be an https URL' };
  }

  if (env.JWT_SECRET.trim().length < 32) {
    return { ok: false, reason: 'JWT_SECRET must be at least 32 characters long' };
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY.trim().length < 32) {
    return {
      ok: false,
      reason: 'SUPABASE_SERVICE_ROLE_KEY must be at least 32 characters long',
    };
  }

  if (present(env.AI_SERVER_SECRET)) {
    if (isPlaceholderSecret(env.AI_SERVER_SECRET) || env.AI_SERVER_SECRET.trim().length < 32) {
      return {
        ok: false,
        reason: 'AI_SERVER_SECRET must be at least 32 characters when it is set',
      };
    }
  }

  return { ok: true };
}

/**
 * Default is false so a directly reachable process ignores X-Forwarded-For.
 * Set TRUST_PROXY=1 only behind a proxy that overwrites that header.
 */
export function trustProxySetting(value) {
  if (value === undefined || value === null || value === '' || value === 'false' || value === '0') {
    return false;
  }
  if (value === 'true') return 1;
  if (/^[1-9]\d*$/.test(String(value))) {
    const hops = Number(value);
    if (hops > 5) {
      throw new Error('TRUST_PROXY hop count must be between 1 and 5');
    }
    return hops;
  }
  throw new Error('TRUST_PROXY must be unset, false, true, or a hop count from 1 to 5');
}
