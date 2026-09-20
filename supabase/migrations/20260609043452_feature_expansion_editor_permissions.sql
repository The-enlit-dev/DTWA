/*
  # Feature expansion migration
*/

-- 1. Newsletters: scheduled delivery
ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- 2. Articles: drop old status check, re-add with pending_review
ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));

-- 3. Profiles: interests array for personalisation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- 4. Editor permissions table
CREATE TABLE IF NOT EXISTS public.editor_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL
    CHECK (content_type IN ('articles','tools','companies','reviews','newsletter')),
  granted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type)
);

ALTER TABLE public.editor_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage editor_permissions"
  ON public.editor_permissions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','super_admin')
  ));

CREATE POLICY "Editors read own permissions"
  ON public.editor_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
