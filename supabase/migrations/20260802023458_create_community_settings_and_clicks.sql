/*
# Community Settings & Click Tracking

1. New Tables
- `community_settings`: single-row config table for Discord/Reddit invite links, editable from admin.
  - `id` (int, primary key, always 1)
  - `discord_url` (text, default placeholder)
  - `reddit_url` (text, default placeholder)
  - `updated_at` (timestamptz)
  - `updated_by` (uuid, references auth.users)
- `community_clicks`: analytics table tracking Discord/Reddit button clicks.
  - `id` (uuid, primary key)
  - `platform` (text: 'discord' or 'reddit')
  - `source` (text: where the click happened, e.g. 'community_page', 'homepage', 'footer')
  - `user_id` (uuid, nullable, references auth.users)
  - `created_at` (timestamptz)
2. Security
- `community_settings`: public read (anon + authenticated) so the frontend can load links; only admins can update.
- `community_clicks`: public insert (anon + authenticated) so any visitor can register a click; only admins can read.
3. Notes
- The settings table is seeded with one row (id=1) with placeholder URLs.
- Admin write access is enforced via a SECURITY DEFINER function that checks the caller's profile role.
*/

CREATE TABLE IF NOT EXISTS community_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  discord_url text NOT NULL DEFAULT 'https://discord.gg/decodingtomorrow',
  reddit_url text NOT NULL DEFAULT 'https://www.reddit.com/r/DecodingTomorrow',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE community_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_community_settings" ON community_settings;
CREATE POLICY "public_read_community_settings"
ON community_settings FOR SELECT
TO anon, authenticated USING (true);

-- Only admins can update settings; handled via SECURITY DEFINER function below.

CREATE TABLE IF NOT EXISTS community_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('discord', 'reddit')),
  source text NOT NULL DEFAULT 'community_page',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a click (anonymous visitors included)
DROP POLICY IF EXISTS "public_insert_community_clicks" ON community_clicks;
CREATE POLICY "public_insert_community_clicks"
ON community_clicks FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Only admins can read click analytics
DROP POLICY IF EXISTS "admin_read_community_clicks" ON community_clicks;
CREATE POLICY "admin_read_community_clicks"
ON community_clicks FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- SECURITY DEFINER function: only admins can update community_settings
CREATE OR REPLACE FUNCTION update_community_settings(
  p_discord_url text,
  p_reddit_url text
)
RETURNS community_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  result community_settings;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;

  UPDATE community_settings
  SET discord_url = p_discord_url,
      reddit_url = p_reddit_url,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = 1
  RETURNING * INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION update_community_settings(text, text) TO authenticated;

-- Seed the settings row
INSERT INTO community_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_community_clicks_created_at ON community_clicks (created_at);
CREATE INDEX IF NOT EXISTS idx_community_clicks_platform ON community_clicks (platform);
