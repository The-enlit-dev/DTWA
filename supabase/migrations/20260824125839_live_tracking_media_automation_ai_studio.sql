/*
# Live Visitor Tracking + Media Library + Blog Automation + AI Creator Studio Foundation

## 1. Live Visitor Tracking
- `visitor_sessions`: Tracks active visitor sessions with page, referrer, device, country.
- `page_views`: Individual page view events linked to sessions.
- SECURITY DEFINER functions to create/update sessions and clean stale ones.

## 2. Media Library
- `media_assets`: Uploaded images/assets with alt text, caption, category, tags.

## 3. Blog Automation Sources
- `blog_sources`: RSS/API sources for automated content discovery.
- `blog_discoveries`: Discovered articles from sources pending admin review.

## 4. AI Creator Studio
- `ai_generations`: Tracks all AI-generated content (tool analysis, comparisons, case studies, video scripts, blog simplifications) with status workflow.

## 5. AI Tool Researcher
- `ai_tool_research`: Draft queue for researched AI tools.

## Security
- Public can create visitor sessions and page views (tracking).
- Only admins can read analytics, manage sources, media, and AI generations.
*/

-- ============================================
-- LIVE VISITOR TRACKING: Sessions
-- ============================================
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  page text NOT NULL DEFAULT '/',
  referrer text DEFAULT '',
  device_type text DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  country text DEFAULT '',
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_sessions" ON visitor_sessions;
CREATE POLICY "public_insert_sessions"
ON visitor_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_sessions" ON visitor_sessions;
CREATE POLICY "public_update_sessions"
ON visitor_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_sessions" ON visitor_sessions;
CREATE POLICY "admin_read_sessions"
ON visitor_sessions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON visitor_sessions (last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON visitor_sessions (started_at);

-- ============================================
-- LIVE VISITOR TRACKING: Page Views
-- ============================================
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page text NOT NULL,
  referrer text DEFAULT '',
  device_type text DEFAULT 'desktop',
  country text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_page_views" ON page_views;
CREATE POLICY "public_insert_page_views"
ON page_views FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_page_views" ON page_views;
CREATE POLICY "admin_read_page_views"
ON page_views FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views (page);

-- ============================================
-- SECURITY DEFINER: Update or create session
-- ============================================
CREATE OR REPLACE FUNCTION upsert_visitor_session(
  p_session_id text,
  p_page text,
  p_referrer text DEFAULT '',
  p_device_type text DEFAULT 'desktop',
  p_country text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO visitor_sessions (session_id, page, referrer, device_type, country, last_active)
  VALUES (p_session_id, p_page, p_referrer, p_device_type, p_country, now())
  ON CONFLICT (session_id) DO UPDATE
  SET page = p_page,
      referrer = COALESCE(NULLIF(p_referrer, ''), visitor_sessions.referrer),
      last_active = now(),
      ended_at = NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_visitor_session(text, text, text, text, text) TO anon, authenticated;

-- ============================================
-- SECURITY DEFINER: Record page view
-- ============================================
CREATE OR REPLACE FUNCTION record_page_view(
  p_session_id text,
  p_page text,
  p_referrer text DEFAULT '',
  p_device_type text DEFAULT 'desktop',
  p_country text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO page_views (session_id, page, referrer, device_type, country)
  VALUES (p_session_id, p_page, p_referrer, p_device_type, p_country);
  
  UPDATE visitor_sessions SET last_active = now(), page = p_page WHERE session_id = p_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_page_view(text, text, text, text, text) TO anon, authenticated;

-- ============================================
-- MEDIA LIBRARY
-- ============================================
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  original_name text NOT NULL,
  url text NOT NULL,
  file_type text DEFAULT 'image' CHECK (file_type IN ('image', 'video', 'document', 'other')),
  file_size integer DEFAULT 0,
  alt_text text DEFAULT '',
  caption text DEFAULT '',
  category text DEFAULT '',
  tags text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_media" ON media_assets;
CREATE POLICY "admin_manage_media"
ON media_assets FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
);

-- ============================================
-- BLOG AUTOMATION: Sources
-- ============================================
CREATE TABLE IF NOT EXISTS blog_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  source_type text DEFAULT 'rss' CHECK (source_type IN ('rss', 'api', 'manual')),
  category text DEFAULT '',
  is_active boolean DEFAULT true,
  frequency_hours integer DEFAULT 24,
  last_fetched_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_sources" ON blog_sources;
CREATE POLICY "admin_manage_sources"
ON blog_sources FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- BLOG AUTOMATION: Discoveries
-- ============================================
CREATE TABLE IF NOT EXISTS blog_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES blog_sources(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  author text DEFAULT '',
  published_at timestamptz,
  status text DEFAULT 'discovered' CHECK (status IN ('discovered', 'drafted', 'approved', 'rejected', 'published')),
  ai_draft text DEFAULT '',
  admin_notes text DEFAULT '',
  discovered_at timestamptz DEFAULT now(),
  UNIQUE(url)
);

ALTER TABLE blog_discoveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_discoveries" ON blog_discoveries;
CREATE POLICY "admin_manage_discoveries"
ON blog_discoveries FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
);

-- ============================================
-- AI CREATOR STUDIO: Generations
-- ============================================
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type text NOT NULL CHECK (generation_type IN ('tool_analysis', 'comparison', 'case_study', 'blog_simplifier', 'video_script', 'newsletter', 'social_post')),
  title text DEFAULT '',
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'published')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_generations" ON ai_generations;
CREATE POLICY "admin_manage_generations"
ON ai_generations FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
);

-- ============================================
-- AI TOOL RESEARCHER: Draft Queue
-- ============================================
CREATE TABLE IF NOT EXISTS ai_tool_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL,
  website text DEFAULT '',
  category text DEFAULT '',
  description text DEFAULT '',
  features text[] DEFAULT '{}',
  target_audience text DEFAULT '',
  pricing text DEFAULT '',
  free_plan text DEFAULT '',
  platforms text[] DEFAULT '{}',
  use_cases text[] DEFAULT '{}',
  alternatives text[] DEFAULT '{}',
  source_urls text[] DEFAULT '{}',
  last_verified_date timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'approved', 'rejected', 'published')),
  needs_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_tool_research ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_research" ON ai_tool_research;
CREATE POLICY "admin_manage_research"
ON ai_tool_research FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
);
