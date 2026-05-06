-- Adds subscription / trial / PayFast columns to the profiles table.
-- Idempotent — safe to re-run.
--
-- Run this in Supabase → SQL Editor → New query → Run.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payfast_token         TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_id       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status   TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_renews_at  TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_until             TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at      TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grace_period_expires_at TIMESTAMPTZ;

-- Backfill: any user already on tier='pro' from earlier tests gets a far-future
-- pro_until so they keep access (ops can manually fix).
UPDATE profiles
   SET pro_until = COALESCE(pro_until, NOW() + INTERVAL '1 month')
 WHERE tier = 'pro' AND pro_until IS NULL;

-- Helpful index for admin / billing queries.
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx ON profiles (subscription_status);
CREATE INDEX IF NOT EXISTS profiles_pro_until_idx           ON profiles (pro_until);
