import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { isPlaceholderSecret } from './envGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = join(__dirname, '..');

// Ensure environment variables are loaded before creating clients.
// In Node ESM, module evaluation order can cause server.js to load after this module,
// so we load env here as well (safe and idempotent).
dotenv.config({ path: join(backendDir, '.env.local') });
dotenv.config({ path: join(backendDir, '.env') });
dotenv.config();

let adminClient = null;

function serviceRoleError() {
  const error = new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  error.code = 'SUPABASE_SERVICE_ROLE_KEY_MISSING';
  return error;
}

export function getSupabaseAdminOrThrow() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    typeof supabaseUrl !== 'string' ||
    typeof supabaseServiceRoleKey !== 'string' ||
    supabaseServiceRoleKey.trim().length < 32 ||
    isPlaceholderSecret(supabaseServiceRoleKey)
  ) {
    throw serviceRoleError();
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

// Server queries use the service-role client only. There is no anon-key fallback.
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseAdminOrThrow();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

export const supabaseAdmin = supabase;
