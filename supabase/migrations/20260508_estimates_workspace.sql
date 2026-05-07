-- Workspace cap: max 5 "active" estimates per project (included_in_project).
-- Rows set to included_in_project = false stay in the database for support
-- recovery; the app only counts included rows toward the limit of 5.

ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS included_in_project boolean DEFAULT true;

UPDATE public.estimates
SET included_in_project = true
WHERE included_in_project IS NULL;
