-- Fail closed for the custom users table.
-- The API reads and writes users with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- The anon and authenticated roles must not be able to read password_hash.
-- Apply in the Supabase SQL editor. This file does not run on server start.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

REVOKE ALL ON TABLE public.users FROM anon, authenticated;
