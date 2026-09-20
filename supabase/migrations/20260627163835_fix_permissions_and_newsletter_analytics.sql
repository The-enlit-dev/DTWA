/*
  # Fix permissions system and newsletter analytics

  ## Summary
  Critical bug fix: admins could not change user roles because the profiles UPDATE
  policy only allowed self-updates. This migration fixes that and improves the
  editor_permissions RLS so toggles actually save.

  ## Changes

  ### 1. profiles table – UPDATE policy fix
  - DROP the old user-only UPDATE policy
  - CREATE a new policy: users can update their own profile, OR admins/super_admins
    can update any profile (needed for promote/revoke editor access)

  ### 2. editor_permissions table – policy cleanup
  - DROP the FOR ALL policy (bad practice per security guidelines)
  - CREATE 4 separate policies: SELECT, INSERT, UPDATE, DELETE
  - Admins/super_admins can fully manage all permissions
  - Editors and regular users can only SELECT their own permissions

  ### 3. newsletters table – analytics columns
  - Add `sent_by` (uuid) – tracks which admin/editor sent the newsletter
  - Add `updated_at` (timestamptz) – tracks last draft save time

  ### 4. Indexes
  - Add index on editor_permissions(user_id) for fast permission lookups
*/

-- ─── 1. FIX PROFILES UPDATE POLICY ───────────────────────────────────────────

-- Drop the old self-only update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Combined policy: own profile OR admin can update any profile
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.role IN ('admin','super_admin')
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.role IN ('admin','super_admin')
    )
  );

-- ─── 2. FIX EDITOR_PERMISSIONS POLICIES ──────────────────────────────────────

-- Drop the FOR ALL policy (not granular enough)
DROP POLICY IF EXISTS "Admins manage editor_permissions" ON public.editor_permissions;
DROP POLICY IF EXISTS "Editors read own permissions" ON public.editor_permissions;

-- SELECT: admins see all, editors/users see own
DROP POLICY IF EXISTS "ep_select" ON public.editor_permissions;
CREATE POLICY "ep_select"
  ON public.editor_permissions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin')
    )
  );

-- INSERT: only admins/super_admins can grant permissions
DROP POLICY IF EXISTS "ep_insert" ON public.editor_permissions;
CREATE POLICY "ep_insert"
  ON public.editor_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin')
    )
  );

-- UPDATE: only admins/super_admins
DROP POLICY IF EXISTS "ep_update" ON public.editor_permissions;
CREATE POLICY "ep_update"
  ON public.editor_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin')
    )
  );

-- DELETE: only admins/super_admins
DROP POLICY IF EXISTS "ep_delete" ON public.editor_permissions;
CREATE POLICY "ep_delete"
  ON public.editor_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin')
    )
  );

-- ─── 3. NEWSLETTERS ANALYTICS COLUMNS ────────────────────────────────────────

ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ─── 4. INDEXES ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_editor_permissions_user_id
  ON public.editor_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_newsletters_status
  ON public.newsletters(status);
