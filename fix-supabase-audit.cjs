const {execSync} = require('child_process');
// Generate the complete SQL fix and copy to clipboard via a temp file approach
const sql = `
-- ============================================================
-- APRIQ FULL DATABASE AUDIT FIX
-- ============================================================

-- 1. ESTIMATES: Add pdf_generated and shared flags
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS pdf_generated boolean DEFAULT false;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS shared boolean DEFAULT false;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS deleted_by_user boolean DEFAULT false;

-- 2. PROFILES: Add last_active_at for activity tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- 3. BLOCK DELETE on all key tables via RLS policies
-- estimates - never delete
DROP POLICY IF EXISTS "block_delete_estimates" ON public.estimates;
CREATE POLICY "block_delete_estimates" ON public.estimates FOR DELETE USING (false);

-- project_estimates - never delete
DROP POLICY IF EXISTS "block_delete_project_estimates" ON public.project_estimates;
CREATE POLICY "block_delete_project_estimates" ON public.project_estimates FOR DELETE USING (false);

-- estimate_snapshots - never delete
DROP POLICY IF EXISTS "block_delete_snapshots" ON public.estimate_snapshots;
CREATE POLICY "block_delete_snapshots" ON public.estimate_snapshots FOR DELETE USING (false);

-- pdf_exports - never delete
DROP POLICY IF EXISTS "block_delete_pdf_exports" ON public.pdf_exports;
CREATE POLICY "block_delete_pdf_exports" ON public.pdf_exports FOR DELETE USING (false);

-- clients - soft delete only (keep data)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_by_user boolean DEFAULT false;
DROP POLICY IF EXISTS "block_delete_clients" ON public.clients;
CREATE POLICY "block_delete_clients" ON public.clients FOR DELETE USING (false);

-- projects - soft delete only
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_by_user boolean DEFAULT false;
DROP POLICY IF EXISTS "block_delete_projects" ON public.projects;
CREATE POLICY "block_delete_projects" ON public.projects FOR DELETE USING (false);

-- profiles - never delete
DROP POLICY IF EXISTS "block_delete_profiles" ON public.profiles;
CREATE POLICY "block_delete_profiles" ON public.profiles FOR DELETE USING (false);

-- 4. WAITLIST: already fixed (name + profession added)

-- 5. FEEDBACK: already fixed (email added)

-- 6. Verify saved_estimates exists with correct structure
CREATE TABLE IF NOT EXISTS public.saved_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid,
  client_id uuid,
  reference_number text,
  inputs_json jsonb,
  result_json jsonb,
  total_project_cost numeric,
  building_category text,
  building_subtype text,
  is_latest boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.saved_estimates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_saved_estimates" ON public.saved_estimates;
CREATE POLICY "users_own_saved_estimates" ON public.saved_estimates FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_insert_saved_estimates" ON public.saved_estimates;
CREATE POLICY "users_insert_saved_estimates" ON public.saved_estimates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "block_delete_saved_estimates" ON public.saved_estimates;
CREATE POLICY "block_delete_saved_estimates" ON public.saved_estimates FOR DELETE USING (false);

SELECT 'All fixes applied successfully' as status;
`;
require('fs').writeFileSync('/tmp/apriq-audit.sql', sql);
console.log('SQL written to /tmp/apriq-audit.sql');
console.log('Length:', sql.length, 'chars');
