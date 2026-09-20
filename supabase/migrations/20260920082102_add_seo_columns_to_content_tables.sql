-- Add SEO columns to ai_tools, companies, and tool_comparisons
-- so the centralized SEO Manager can edit them inline.

ALTER TABLE public.ai_tools
  ADD COLUMN IF NOT EXISTS seo_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS canonical_url text DEFAULT '';

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS seo_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS canonical_url text DEFAULT '';

ALTER TABLE public.tool_comparisons
  ADD COLUMN IF NOT EXISTS seo_title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS canonical_url text DEFAULT '';
