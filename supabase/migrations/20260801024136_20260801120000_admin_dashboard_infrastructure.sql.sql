/*
# Admin Dashboard: User Bans, Content Reports, Homepage Banners, Feature Flags

## Overview
Adds admin management infrastructure: user banning, content moderation reports,
homepage banner/announcement system, and is_featured columns on interactive tables.
Also adds SECURITY DEFINER functions for admin-only operations.

## 1. Modified Tables
- `profiles` — adds is_banned, banned_at, banned_reason
- `projects` — adds is_featured
- `predictions` — adds is_featured
- `business_ideas` — adds is_featured
- `challenges` — adds is_featured

## 2. New Tables
- `content_reports` — user-submitted reports for moderation
- `homepage_banners` — admin-managed banners shown on homepage

## 3. Security
- RLS on all new tables with admin/editor management policies.
- SECURITY DEFINER functions: admin_set_ban_status, admin_set_user_role, send_notification_to_all.

## 4. Notes
- All changes additive. Idempotent.
*/

-- ============ PROFILES: BAN COLUMNS ============
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text DEFAULT '';

-- ============ INTERACTIVE TABLES: IS_FEATURED ============
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_predictions_featured ON predictions(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_ideas_featured ON business_ideas(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON challenges(is_featured) WHERE is_featured = true;

-- ============ CONTENT REPORTS ============
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content_type text NOT NULL CHECK (content_type IN ('project','prediction','project_comment','challenge_submission','business_idea','profile')),
  content_id text NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports" ON content_reports;
CREATE POLICY "Users can submit reports" ON content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports" ON content_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON content_reports;
CREATE POLICY "Admins can view all reports" ON content_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;
CREATE POLICY "Admins can update reports" ON content_reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

DROP POLICY IF EXISTS "Admins can delete reports" ON content_reports;
CREATE POLICY "Admins can delete reports" ON content_reports FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at DESC);

-- ============ HOMEPAGE BANNERS ============
CREATE TABLE IF NOT EXISTS homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text DEFAULT '',
  link_url text DEFAULT '',
  bg_color text DEFAULT '#4A6CF7',
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active banners publicly readable" ON homepage_banners;
CREATE POLICY "Active banners publicly readable" ON homepage_banners FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can insert banners" ON homepage_banners;
CREATE POLICY "Admins can insert banners" ON homepage_banners FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

DROP POLICY IF EXISTS "Admins can update banners" ON homepage_banners;
CREATE POLICY "Admins can update banners" ON homepage_banners FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

DROP POLICY IF EXISTS "Admins can delete banners" ON homepage_banners;
CREATE POLICY "Admins can delete banners" ON homepage_banners FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

CREATE INDEX IF NOT EXISTS idx_banners_active ON homepage_banners(is_active) WHERE is_active = true;

-- ============ ADMIN: SEND NOTIFICATION TO ALL USERS ============
CREATE OR REPLACE FUNCTION send_notification_to_all(notif_type text, notif_title text, notif_body text, notif_link text DEFAULT '')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer;
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  INSERT INTO notifications (user_id, type, title, body, link_url)
  SELECT id, notif_type, notif_title, notif_body, notif_link
  FROM profiles
  WHERE is_banned = false OR is_banned IS NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- ============ ADMIN: BAN/UNBAN USER ============
CREATE OR REPLACE FUNCTION admin_set_ban_status(target_user_id uuid, ban boolean, reason text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  UPDATE profiles
  SET is_banned = ban,
      banned_at = CASE WHEN ban THEN now() ELSE NULL END,
      banned_reason = CASE WHEN ban THEN reason ELSE '' END
  WHERE id = target_user_id;
END;
$$;

-- ============ ADMIN: SET USER ROLE ============
CREATE OR REPLACE FUNCTION admin_set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Permission denied: super_admin role required';
  END IF;
  IF new_role NOT IN ('user', 'editor', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;
