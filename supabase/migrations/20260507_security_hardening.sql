-- 20260507_security_hardening.sql
-- Security hardening: waitlist RPC (no anon UPDATE), profile privilege guards,
-- estimate save tier enforcement, optional admin flag.
--
-- Run in Supabase SQL editor. Idempotent / safe to re-run.

------------------------------------------------------------------------------
-- 1) WAITLIST: remove anon UPDATE and replace with RPC upsert
------------------------------------------------------------------------------

-- Ensure RLS is enabled
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Keep insert open (public marketing form), but do not allow anon UPDATE.
DROP POLICY IF EXISTS "waitlist_anon_update" ON public.waitlist;

-- Ensure anon insert exists
DROP POLICY IF EXISTS "waitlist_anon_insert" ON public.waitlist;
CREATE POLICY "waitlist_anon_insert" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Canonical waitlist join/upsert RPC (normalizes email and upserts).
CREATE OR REPLACE FUNCTION public.waitlist_join(p_email text, p_name text DEFAULT NULL, p_profession text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e text := lower(trim(coalesce(p_email, '')));
BEGIN
  IF e = '' OR position('@' in e) = 0 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  INSERT INTO public.waitlist (email, name, profession, updated_at)
  VALUES (e, nullif(trim(coalesce(p_name, '')), ''), nullif(trim(coalesce(p_profession, '')), ''), now())
  ON CONFLICT (email) DO UPDATE
    SET name       = EXCLUDED.name,
        profession = EXCLUDED.profession,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.waitlist_join(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.waitlist_join(text, text, text) TO anon, authenticated;

------------------------------------------------------------------------------
-- 2) PROFILES: protect privileged columns from client updates
------------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- AI quota columns used by api/ai-advisor.js (safe to add if missing).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_questions_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_questions_reset_date text;

CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role / SQL editor maintenance can still update privileged fields.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block any attempt to change privileged / entitlement fields client-side.
  IF (NEW.tier IS DISTINCT FROM OLD.tier)
     OR (NEW.is_admin IS DISTINCT FROM OLD.is_admin)
     OR (NEW.payfast_token IS DISTINCT FROM OLD.payfast_token)
     OR (NEW.subscription_id IS DISTINCT FROM OLD.subscription_id)
     OR (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
     OR (NEW.subscription_started_at IS DISTINCT FROM OLD.subscription_started_at)
     OR (NEW.subscription_renews_at IS DISTINCT FROM OLD.subscription_renews_at)
     OR (NEW.subscription_updated_at IS DISTINCT FROM OLD.subscription_updated_at)
     OR (NEW.pro_until IS DISTINCT FROM OLD.pro_until)
     OR (NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at)
     OR (NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at)
     OR (NEW.trial_end_date IS DISTINCT FROM OLD.trial_end_date)
     OR (NEW.grace_period_expires_at IS DISTINCT FROM OLD.grace_period_expires_at)
     OR (NEW.ai_questions_used IS DISTINCT FROM OLD.ai_questions_used)
     OR (NEW.ai_questions_reset_date IS DISTINCT FROM OLD.ai_questions_reset_date)
  THEN
    RAISE EXCEPTION 'Forbidden: privileged profile fields cannot be updated from the client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_block_privileged_updates ON public.profiles;
CREATE TRIGGER trg_profiles_block_privileged_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_block_privileged_updates();

------------------------------------------------------------------------------
-- 3) ESTIMATES: enforce Pro/trial on writes (client uses anon key + RLS)
------------------------------------------------------------------------------

-- Helper predicate: does the current user have paid/trial access right now?
CREATE OR REPLACE FUNCTION public.user_has_pro_access(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid
      AND (
        (p.tier = 'pro'   AND (p.pro_until IS NULL OR p.pro_until > now()))
        OR
        (p.tier = 'trial' AND p.trial_end_date IS NOT NULL AND p.trial_end_date > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_pro_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.user_has_pro_access(uuid) TO anon, authenticated;

-- Tighten INSERT/UPDATE checks. Keep SELECT/DELETE ownership rules.
DROP POLICY IF EXISTS "estimates_owner_insert" ON public.estimates;
DROP POLICY IF EXISTS "estimates_owner_update" ON public.estimates;

CREATE POLICY "estimates_owner_insert" ON public.estimates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.user_has_pro_access(auth.uid()));

CREATE POLICY "estimates_owner_update" ON public.estimates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.user_has_pro_access(auth.uid()));

