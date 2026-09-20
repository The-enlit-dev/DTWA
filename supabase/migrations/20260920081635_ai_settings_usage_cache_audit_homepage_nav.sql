/*
# AI Settings, Usage Tracking, Caching, Audit Logs
*/

-- ============================================
-- AI SETTINGS (single-row config table)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text DEFAULT 'openrouter' CHECK (provider IN ('openrouter', 'gemini', 'custom')),
  model text DEFAULT 'openrouter/free',
  fallback_model text DEFAULT '',
  temperature real DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens integer DEFAULT 2048 CHECK (max_tokens > 0 AND max_tokens <= 32000),
  daily_request_limit integer DEFAULT 50 CHECK (daily_request_limit > 0),
  ai_enabled boolean DEFAULT true,
  system_prompt text DEFAULT 'You are a helpful AI assistant for Decoding Tomorrow, a platform about AI tools, companies, and technology. Write clear, accurate, and engaging content.',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_ai_settings" ON ai_settings;
CREATE POLICY "admin_manage_ai_settings"
ON ai_settings FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Seed default settings row
INSERT INTO ai_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- ============================================
-- AI USAGE LOG
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL,
  prompt_hash text NOT NULL,
  model text NOT NULL,
  provider text NOT NULL,
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'cached', 'rate_limited', 'disabled')),
  tokens_used integer DEFAULT 0,
  error_message text DEFAULT '',
  requested_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_ai_usage" ON ai_usage_log;
CREATE POLICY "admin_read_ai_usage"
ON ai_usage_log FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
);

DROP POLICY IF EXISTS "admin_insert_ai_usage" ON ai_usage_log;
CREATE POLICY "admin_insert_ai_usage"
ON ai_usage_log FOR INSERT TO authenticated
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log (feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_status ON ai_usage_log (status);

-- ============================================
-- AI CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text NOT NULL UNIQUE,
  feature text NOT NULL,
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  model text NOT NULL,
  provider text NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_ai_cache" ON ai_cache;
CREATE POLICY "admin_manage_ai_cache"
ON ai_cache FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache (prompt_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_feature ON ai_cache (feature);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name text DEFAULT '',
  action text NOT NULL,
  entity_type text DEFAULT '',
  entity_id text DEFAULT '',
  entity_title text DEFAULT '',
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit" ON admin_audit_log;
CREATE POLICY "admin_read_audit"
ON admin_audit_log FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "admin_insert_audit" ON admin_audit_log;
CREATE POLICY "admin_insert_audit"
ON admin_audit_log FOR INSERT TO authenticated
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit_log (actor_id);

-- SECURITY DEFINER: Record audit entry
CREATE OR REPLACE FUNCTION record_audit(
  p_action text,
  p_entity_type text DEFAULT '',
  p_entity_id text DEFAULT '',
  p_entity_title text DEFAULT '',
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_username text;
BEGIN
  SELECT username INTO v_username FROM profiles WHERE id = v_uid;
  INSERT INTO admin_audit_log (actor_id, actor_name, action, entity_type, entity_id, entity_title, details)
  VALUES (v_uid, COALESCE(v_username, ''), p_action, p_entity_type, p_entity_id, p_entity_title, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION record_audit(text, text, text, text, jsonb) TO authenticated;

-- ============================================
-- HOMEPAGE BUILDER CONFIG
-- ============================================
CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_label text NOT NULL,
  is_enabled boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  config jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_homepage_sections" ON homepage_sections;
CREATE POLICY "admin_manage_homepage_sections"
ON homepage_sections FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor'))
);

DROP POLICY IF EXISTS "public_read_homepage_sections" ON homepage_sections;
CREATE POLICY "public_read_homepage_sections"
ON homepage_sections FOR SELECT TO anon, authenticated USING (true);

-- Seed default sections
INSERT INTO homepage_sections (section_key, section_label, sort_order, config) VALUES
  ('hero', 'Hero Section', 0, '{"title":"","description":""}'::jsonb),
  ('featured_article', 'Featured Article', 1, '{}'::jsonb),
  ('trending', 'Trending This Week', 2, '{}'::jsonb),
  ('tools_spotlight', 'Tools Spotlight', 3, '{}'::jsonb),
  ('glossary_spotlight', 'Glossary Spotlight', 4, '{}'::jsonb),
  ('learn_section', 'Learn Section', 5, '{}'::jsonb),
  ('featured_video', 'Featured Video', 6, '{}'::jsonb),
  ('popular_categories', 'Popular Categories', 7, '{}'::jsonb),
  ('tool_of_the_week', 'Tool of the Week', 8, '{}'::jsonb),
  ('founder_section', 'Founder Section', 9, '{}'::jsonb),
  ('newsletter_section', 'Newsletter Section', 10, '{}'::jsonb),
  ('join_community', 'Join Community', 11, '{}'::jsonb),
  ('news_ticker', 'News Ticker', 12, '{}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================
-- NAVIGATION MENU
-- ============================================
CREATE TABLE IF NOT EXISTS nav_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  parent_id uuid REFERENCES nav_menu_items(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nav_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_nav" ON nav_menu_items;
CREATE POLICY "admin_manage_nav"
ON nav_menu_items FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "public_read_nav" ON nav_menu_items;
CREATE POLICY "public_read_nav"
ON nav_menu_items FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_nav_sort ON nav_menu_items (sort_order);
CREATE INDEX IF NOT EXISTS idx_nav_parent ON nav_menu_items (parent_id);

-- ============================================
-- SITE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text DEFAULT 'Decoding Tomorrow With Attharva',
  tagline text DEFAULT 'AI, Business & Technology — Explained Simply',
  logo_url text DEFAULT '/my_good_picture_for_pfp.png',
  favicon_url text DEFAULT '/my_good_picture_for_pfp.png',
  contact_email text DEFAULT '',
  social_links jsonb DEFAULT '{"twitter":"","youtube":"","instagram":"","linkedin":""}'::jsonb,
  default_seo_title text DEFAULT 'Decoding Tomorrow With Attharva — AI, Business & Technology',
  default_meta_description text DEFAULT 'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply.',
  default_og_image text DEFAULT '/my_good_picture_for_pfp.png',
  footer_text text DEFAULT '© Decoding Tomorrow With Attharva. All rights reserved.',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_site_settings" ON site_settings;
CREATE POLICY "admin_manage_site_settings"
ON site_settings FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings"
ON site_settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO site_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- ============================================
-- BLOG BLOCKS (block-based editor storage)
-- ============================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS blocks jsonb DEFAULT '[]';
