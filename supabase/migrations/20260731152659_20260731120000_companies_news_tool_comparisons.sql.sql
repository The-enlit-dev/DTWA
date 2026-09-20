/*
# Expand Company Profiles, add AI News + Tool Comparisons

1. Modified Tables
   - `companies` — adds rich profile fields requested for the company database:
     - `ceo` (text) — current Chief Executive
     - `business_model` (text) — how the company makes money
     - `competitors` (text[]) — names of competing companies
     - `latest_developments` (text[]) — recent notable moves (bulleted list)
   These are additive, non-destructive columns. Existing rows keep working.

2. New Tables
   - `news_articles` — the AI News section. Fields:
     - id (uuid PK)
     - title, slug (unique), summary, content (optional long body)
     - category (text), image_url (text), source_name (text), source_url (text)
     - author (text), is_trending (bool), is_featured (bool)
     - published_at (timestamptz), view_count (int), tags (text[])
     - created_at, updated_at
   - `tool_comparisons` — comparison page content. Fields:
     - id (uuid PK)
     - title, slug (unique), summary
     - tool_a (text), tool_b (text) — names of the two tools being compared
     - tool_a_slug, tool_b_slug (text) — links into ai_tools
     - features (jsonb) — array of { feature, tool_a_value, tool_b_value }
     - pros_cons (jsonb) — { tool_a: { pros:[], cons:[] }, tool_b: { pros:[], cons:[] } }
     - pricing (jsonb) — { tool_a: { plan, price, details }, tool_b: {...} }
     - use_cases (jsonb) — { tool_a: [], tool_b: [] }
     - recommendation (text)
     - winner (text) — 'tool_a' | 'tool_b' | 'tie'
     - category (text), tags (text[])
     - view_count (int), published_at, created_at, updated_at

3. Security
   - RLS enabled on `news_articles` and `tool_comparisons`.
   - Public read (TO anon, authenticated) for published content.
   - Editor/admin write for content management (same pattern as existing tables).

4. Important Notes
   - No data is dropped or renamed. Existing companies rows are unaffected.
   - Indexes added on slug + published_at for the new tables.
*/

-- 1. Expand companies table (additive only)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS ceo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_model text DEFAULT '',
  ADD COLUMN IF NOT EXISTS competitors text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latest_developments text[] DEFAULT '{}';

-- 2. news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text DEFAULT '',
  content text DEFAULT '',
  category text DEFAULT 'AI',
  image_url text DEFAULT '',
  source_name text DEFAULT '',
  source_url text DEFAULT '',
  author text DEFAULT 'Decoding Tomorrow',
  is_trending boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  view_count integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "News is publicly readable" ON news_articles;
CREATE POLICY "News is publicly readable"
  ON news_articles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Editors can insert news" ON news_articles;
CREATE POLICY "Editors can insert news"
  ON news_articles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

DROP POLICY IF EXISTS "Editors can update news" ON news_articles;
CREATE POLICY "Editors can update news"
  ON news_articles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

DROP POLICY IF EXISTS "Admins can delete news" ON news_articles;
CREATE POLICY "Admins can delete news"
  ON news_articles FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_trending ON news_articles(is_trending) WHERE is_trending = true;

-- 3. tool_comparisons table
CREATE TABLE IF NOT EXISTS tool_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text DEFAULT '',
  tool_a text NOT NULL,
  tool_b text NOT NULL,
  tool_a_slug text DEFAULT '',
  tool_b_slug text DEFAULT '',
  features jsonb DEFAULT '[]'::jsonb,
  pros_cons jsonb DEFAULT '{}'::jsonb,
  pricing jsonb DEFAULT '{}'::jsonb,
  use_cases jsonb DEFAULT '{}'::jsonb,
  recommendation text DEFAULT '',
  winner text DEFAULT 'tie' CHECK (winner IN ('tool_a', 'tool_b', 'tie')),
  category text DEFAULT 'Comparison',
  tags text[] DEFAULT '{}',
  view_count integer DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tool_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comparisons are publicly readable" ON tool_comparisons;
CREATE POLICY "Comparisons are publicly readable"
  ON tool_comparisons FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Editors can insert comparisons" ON tool_comparisons;
CREATE POLICY "Editors can insert comparisons"
  ON tool_comparisons FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

DROP POLICY IF EXISTS "Editors can update comparisons" ON tool_comparisons;
CREATE POLICY "Editors can update comparisons"
  ON tool_comparisons FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')));

DROP POLICY IF EXISTS "Admins can delete comparisons" ON tool_comparisons;
CREATE POLICY "Admins can delete comparisons"
  ON tool_comparisons FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_tool_comparisons_slug ON tool_comparisons(slug);
CREATE INDEX IF NOT EXISTS idx_tool_comparisons_published_at ON tool_comparisons(published_at DESC);
