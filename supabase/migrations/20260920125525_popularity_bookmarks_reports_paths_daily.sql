/*
# Content popularity tracking, bookmarks sync, content reports, daily AI hub
*/

-- ============================================
-- CONTENT EVENTS (anonymous popularity tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS content_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('view', 'click', 'share', 'bookmark', 'search')),
  content_type text NOT NULL CHECK (content_type IN ('article', 'tool', 'glossary', 'company', 'comparison', 'video', 'learning_path')),
  content_id text NOT NULL,
  content_slug text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_events" ON content_events;
CREATE POLICY "public_insert_events"
ON content_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_events" ON content_events;
CREATE POLICY "admin_read_events"
ON content_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

CREATE INDEX IF NOT EXISTS idx_events_created ON content_events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_content ON content_events (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON content_events (event_type);

-- SECURITY DEFINER: Record content event
CREATE OR REPLACE FUNCTION record_content_event(
  p_event_type text,
  p_content_type text,
  p_content_id text,
  p_content_slug text DEFAULT '',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO content_events (event_type, content_type, content_id, content_slug, metadata)
  VALUES (p_event_type, p_content_type, p_content_id, p_content_slug, p_metadata);
END;
$$;

GRANT EXECUTE ON FUNCTION record_content_event(text, text, text, text, jsonb) TO anon, authenticated;

-- ============================================
-- BOOKMARKS (for logged-in users)
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('article', 'tool', 'glossary', 'company', 'comparison')),
  content_id text NOT NULL,
  content_slug text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_bookmarks" ON bookmarks;
CREATE POLICY "user_read_bookmarks"
ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_bookmarks" ON bookmarks;
CREATE POLICY "user_insert_bookmarks"
ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_delete_bookmarks" ON bookmarks;
CREATE POLICY "user_delete_bookmarks"
ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id);

-- ============================================
-- CONTENT REPORTS (public can submit, admin manages)
-- ============================================
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text NOT NULL,
  content_slug text DEFAULT '',
  report_type text NOT NULL CHECK (report_type IN ('incorrect_info', 'broken_link', 'outdated', 'typo', 'other')),
  description text DEFAULT '',
  reporter_email text DEFAULT '',
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_submit_reports" ON content_reports;
CREATE POLICY "public_submit_reports"
ON content_reports FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_reports" ON content_reports;
CREATE POLICY "admin_manage_reports"
ON content_reports FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports (status);

-- ============================================
-- LEARNING PATHS
-- ============================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  difficulty text DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  steps jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_paths" ON learning_paths;
CREATE POLICY "public_read_paths"
ON learning_paths FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_paths" ON learning_paths;
CREATE POLICY "admin_manage_paths"
ON learning_paths FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

-- Seed default learning path: AI Basics
INSERT INTO learning_paths (title, slug, description, difficulty, is_published, sort_order, steps) VALUES
('AI Basics', 'ai-basics', 'Start your AI journey from zero. Learn the fundamentals step by step.', 'beginner', true, 0,
  '[
    {"title": "What is AI?", "description": "Understand artificial intelligence in simple terms", "glossary_slug": "artificial-intelligence", "resource_type": "glossary"},
    {"title": "Machine Learning", "description": "How machines learn from data", "glossary_slug": "machine-learning", "resource_type": "glossary"},
    {"title": "Neural Networks", "description": "The building blocks of modern AI", "glossary_slug": "neural-network", "resource_type": "glossary"},
    {"title": "Large Language Models", "description": "How ChatGPT and similar tools work", "glossary_slug": "large-language-model", "resource_type": "glossary"},
    {"title": "Generative AI", "description": "AI that creates new content", "glossary_slug": "generative-ai", "resource_type": "glossary"},
    {"title": "AI Agents", "description": "AI that takes actions autonomously", "glossary_slug": "ai-agent", "resource_type": "glossary"},
    {"title": "RAG", "description": "Retrieval-Augmented Generation explained", "glossary_slug": "rag", "resource_type": "glossary"},
    {"title": "Embeddings", "description": "How AI understands meaning", "glossary_slug": "embedding", "resource_type": "glossary"}
  ]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DAILY AI HUB
-- ============================================
CREATE TABLE IF NOT EXISTS daily_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_date date NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  ai_update text DEFAULT '',
  ai_update_source text DEFAULT '',
  tool_of_day_id text DEFAULT '',
  tool_of_day_name text DEFAULT '',
  term_of_day_slug text DEFAULT '',
  term_of_day_name text DEFAULT '',
  article_of_day_slug text DEFAULT '',
  article_of_day_title text DEFAULT '',
  prompt_of_day text DEFAULT '',
  prompt_of_day_category text DEFAULT '',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_daily" ON daily_content;
CREATE POLICY "public_read_daily"
ON daily_content FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_daily" ON daily_content;
CREATE POLICY "admin_manage_daily"
ON daily_content FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

-- ============================================
-- SEARCH QUERIES (anonymous, for tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_search" ON search_queries;
CREATE POLICY "public_insert_search"
ON search_queries FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_search" ON search_queries;
CREATE POLICY "admin_read_search"
ON search_queries FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

CREATE INDEX IF NOT EXISTS idx_search_created ON search_queries (created_at);
