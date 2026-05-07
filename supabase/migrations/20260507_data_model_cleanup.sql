-- 20260507_data_model_cleanup.sql
-- Consolidates the estimate-related tables, ensures waitlist deduplicates by
-- email, and ensures contact_submissions can accept anonymous public inserts.
--
-- Apply via Supabase SQL editor. Each section is idempotent / re-runnable.

------------------------------------------------------------------------------
-- 1. ESTIMATES — make it the canonical store
------------------------------------------------------------------------------

-- Ensure all columns the app writes exist. We use JSONB for the full inputs
-- and result blobs (everything is preserved without needing dedicated cols).
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS user_id           uuid,
  ADD COLUMN IF NOT EXISTS project_id        uuid,
  ADD COLUMN IF NOT EXISTS client_id         uuid,
  ADD COLUMN IF NOT EXISTS reference_number  text,
  ADD COLUMN IF NOT EXISTS inputs_json       jsonb,
  ADD COLUMN IF NOT EXISTS result_json       jsonb,
  ADD COLUMN IF NOT EXISTS total_project_cost numeric,
  ADD COLUMN IF NOT EXISTS is_latest         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS shared            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pdf_generated     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at        timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- Make sure the FK to auth.users has CASCADE delete (so deleting a user
-- automatically removes all their estimates). This was already done in the
-- earlier 20260506 migration but we re-assert here for safety.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimates_user_id_fkey')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class r ON r.oid = c.confrelid
       JOIN pg_namespace n ON n.oid = r.relnamespace
       WHERE c.conname = 'estimates_user_id_fkey'
         AND n.nspname = 'auth'
         AND r.relname = 'users'
     )
  THEN
    ALTER TABLE public.estimates DROP CONSTRAINT estimates_user_id_fkey;
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Indexes that benefit our access patterns.
CREATE INDEX IF NOT EXISTS idx_estimates_user_id     ON public.estimates (user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project_id  ON public.estimates (project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_is_latest   ON public.estimates (project_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_estimates_created_at  ON public.estimates (created_at DESC);

-- RLS — owners can do everything to their own rows, no one else can see them.
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estimates_owner_select" ON public.estimates;
DROP POLICY IF EXISTS "estimates_owner_insert" ON public.estimates;
DROP POLICY IF EXISTS "estimates_owner_update" ON public.estimates;
DROP POLICY IF EXISTS "estimates_owner_delete" ON public.estimates;

CREATE POLICY "estimates_owner_select" ON public.estimates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "estimates_owner_insert" ON public.estimates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "estimates_owner_update" ON public.estimates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "estimates_owner_delete" ON public.estimates
  FOR DELETE USING (auth.uid() = user_id);

------------------------------------------------------------------------------
-- 2. PROJECT_ESTIMATES — drop the dead duplicate table
------------------------------------------------------------------------------
-- This table mirrored a subset of `estimates` data. The frontend now writes
-- only to `estimates`. Drop the dead table.

DROP TABLE IF EXISTS public.project_estimates;

------------------------------------------------------------------------------
-- 3. SAVED_ESTIMATES — drop if unused (it's never written to in the app)
------------------------------------------------------------------------------
-- The only reference to saved_estimates was in the old account-deletion
-- flow, which now relies on FK CASCADE from auth.users. The table was never
-- populated in production. Drop it.

DROP TABLE IF EXISTS public.saved_estimates;

------------------------------------------------------------------------------
-- 4. ESTIMATE_SNAPSHOTS — keep (used by the share-link feature)
------------------------------------------------------------------------------
-- estimate_snapshots is the share-link table: when a user clicks "Share"
-- on an estimate, a snapshot row is inserted with a public share_token.
-- The /estimate/:share_token route reads from this table. KEEP AS IS.
--
-- Just make sure the FK is on auth.users with CASCADE.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estimate_snapshots_user_id_fkey')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class r ON r.oid = c.confrelid
       JOIN pg_namespace n ON n.oid = r.relnamespace
       WHERE c.conname = 'estimate_snapshots_user_id_fkey'
         AND n.nspname = 'auth'
         AND r.relname = 'users'
     )
  THEN
    ALTER TABLE public.estimate_snapshots DROP CONSTRAINT estimate_snapshots_user_id_fkey;
    ALTER TABLE public.estimate_snapshots
      ADD CONSTRAINT estimate_snapshots_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

------------------------------------------------------------------------------
-- 5. WAITLIST — dedupe by email
------------------------------------------------------------------------------

-- Make sure the table exists (in case this is a fresh deployment).
CREATE TABLE IF NOT EXISTS public.waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text,
  name        text,
  profession  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Normalise existing emails to lowercase / trimmed BEFORE adding the unique
-- constraint, otherwise duplicates that differ only by case will block it.
UPDATE public.waitlist
SET email = lower(trim(email))
WHERE email IS NOT NULL AND email <> lower(trim(email));

-- De-duplicate any pre-existing duplicate rows, keeping the newest.
DELETE FROM public.waitlist a
USING public.waitlist b
WHERE a.email = b.email
  AND a.created_at < b.created_at;

ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Unique constraint on email so the upsert in handleWaitlist works.
ALTER TABLE public.waitlist DROP CONSTRAINT IF EXISTS waitlist_email_unique;
ALTER TABLE public.waitlist ADD  CONSTRAINT waitlist_email_unique UNIQUE (email);

-- Allow anonymous public inserts (the form is on the marketing site and is
-- not auth-gated). RLS still prevents reads.
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_anon_insert" ON public.waitlist;
CREATE POLICY "waitlist_anon_insert" ON public.waitlist
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "waitlist_anon_update" ON public.waitlist;
CREATE POLICY "waitlist_anon_update" ON public.waitlist
  FOR UPDATE USING (true) WITH CHECK (true);

------------------------------------------------------------------------------
-- 6. CONTACT_SUBMISSIONS — ensure it accepts public inserts
------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,
  surname     text,
  email       text,
  message     text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_submissions_anon_insert" ON public.contact_submissions;
CREATE POLICY "contact_submissions_anon_insert" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON public.contact_submissions (created_at DESC);

------------------------------------------------------------------------------
-- 7. DELETE_USER RPC — safety net for self-service account deletion
------------------------------------------------------------------------------
-- The Profile page calls supabase.rpc('delete_user') to delete the caller's
-- auth.users row. Since RLS prevents direct deletion of auth.users from the
-- client, we expose a SECURITY DEFINER RPC that does it on the user's behalf.
-- All app data CASCADES away via FK ON DELETE CASCADE.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
