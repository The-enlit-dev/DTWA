/*
# Learning Hub Tables

1. New Tables
- `learning_categories`: Resource categories (AI Basics, ML, Deep Learning, etc.).
- `learning_tags`: Resource tags for filtering.
- `learning_resources`: Uploaded resources (PDFs, PPTs, docs, guides, cheat sheets).

2. Security
- Public read on categories, tags, and published resources.
- Editors with learning_resources permission + admins can insert/update resources.
- Only admins can delete resources and manage categories/tags.

3. Permission system
- Extends editor_permissions CHECK constraint to include 'learning_resources', 'courses', and 'glossary' (which existed in data but not the old constraint).
- Adds SECURITY DEFINER functions for granting/revoking permissions.
- Adds view/download increment functions for resources.
*/

-- ============================================
-- LEARNING HUB: Categories
-- ============================================
CREATE TABLE IF NOT EXISTS learning_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT 'BookOpen',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_learning_categories" ON learning_categories;
CREATE POLICY "public_read_learning_categories"
ON learning_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_learning_categories" ON learning_categories;
CREATE POLICY "admin_manage_learning_categories"
ON learning_categories FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- LEARNING HUB: Tags
-- ============================================
CREATE TABLE IF NOT EXISTS learning_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_learning_tags" ON learning_tags;
CREATE POLICY "public_read_learning_tags"
ON learning_tags FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_learning_tags" ON learning_tags;
CREATE POLICY "admin_manage_learning_tags"
ON learning_tags FOR ALL
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- LEARNING HUB: Resources
-- ============================================
CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  category_id uuid REFERENCES learning_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  file_url text,
  file_type text DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'ppt', 'pptx', 'doc', 'docx', 'image', 'link', 'other')),
  thumbnail_url text DEFAULT '',
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_published boolean DEFAULT false,
  view_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_resources" ON learning_resources;
CREATE POLICY "public_read_published_resources"
ON learning_resources FOR SELECT TO anon, authenticated
USING (is_published = true OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
));

DROP POLICY IF EXISTS "contributor_insert_resources" ON learning_resources;
CREATE POLICY "contributor_insert_resources"
ON learning_resources FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'learning_resources'
    AND p.role = 'editor'
  )
);

DROP POLICY IF EXISTS "contributor_update_resources" ON learning_resources;
CREATE POLICY "contributor_update_resources"
ON learning_resources FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR (author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'learning_resources'
    AND p.role = 'editor'
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR (author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'learning_resources'
    AND p.role = 'editor'
  ))
);

DROP POLICY IF EXISTS "admin_delete_resources" ON learning_resources;
CREATE POLICY "admin_delete_resources"
ON learning_resources FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_slug ON learning_resources (slug);
CREATE INDEX IF NOT EXISTS idx_learning_resources_category ON learning_resources (category_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_published ON learning_resources (is_published);

-- ============================================
-- PERMISSION SYSTEM: Extend editor_permissions constraint
-- Includes all existing content types plus new 'learning_resources' and 'courses'
-- ============================================
ALTER TABLE editor_permissions DROP CONSTRAINT IF EXISTS editor_permissions_content_type_check;
ALTER TABLE editor_permissions ADD CONSTRAINT editor_permissions_content_type_check
CHECK (content_type IN ('articles','tools','companies','reviews','newsletter','glossary','learning_resources','courses'));

-- ============================================
-- SECURITY DEFINER: Grant editor permission (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION grant_editor_permission(
  p_user_id uuid,
  p_content_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;

  INSERT INTO editor_permissions (user_id, content_type, granted_by)
  VALUES (p_user_id, p_content_type, auth.uid())
  ON CONFLICT (user_id, content_type) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION grant_editor_permission(uuid, text) TO authenticated;

-- ============================================
-- SECURITY DEFINER: Revoke editor permission (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION revoke_editor_permission(
  p_user_id uuid,
  p_content_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;

  DELETE FROM editor_permissions
  WHERE user_id = p_user_id AND content_type = p_content_type;
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_editor_permission(uuid, text) TO authenticated;

-- ============================================
-- SECURITY DEFINER: Increment resource view count
-- ============================================
CREATE OR REPLACE FUNCTION increment_resource_view(resource_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE learning_resources
  SET view_count = view_count + 1
  WHERE slug = resource_slug AND is_published = true;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_resource_view(text) TO anon, authenticated;

-- ============================================
-- SECURITY DEFINER: Increment resource download count
-- ============================================
CREATE OR REPLACE FUNCTION increment_resource_download(resource_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE learning_resources
  SET download_count = download_count + 1
  WHERE slug = resource_slug AND is_published = true;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_resource_download(text) TO anon, authenticated;

-- ============================================
-- SEED: Default learning categories
-- ============================================
INSERT INTO learning_categories (name, slug, description, icon, sort_order) VALUES
  ('AI Basics', 'ai-basics', 'Fundamental concepts of artificial intelligence', 'Sparkles', 1),
  ('Machine Learning', 'machine-learning', 'ML algorithms, techniques, and theory', 'Brain', 2),
  ('Deep Learning', 'deep-learning', 'Neural networks, transformers, and deep architectures', 'Network', 3),
  ('AI Agents', 'ai-agents', 'Building autonomous AI agents and multi-agent systems', 'Bot', 4),
  ('Prompt Engineering', 'prompt-engineering', 'Crafting effective prompts for LLMs', 'MessageSquare', 5),
  ('Career Resources', 'career-resources', 'Job guides, interview prep, and career advice for AI roles', 'Briefcase', 6),
  ('Tools', 'tools', 'Guides and documentation for AI tools and platforms', 'Wrench', 7),
  ('Research Papers', 'research-papers', 'Key AI research papers and literature', 'FileText', 8)
ON CONFLICT (slug) DO NOTHING;
