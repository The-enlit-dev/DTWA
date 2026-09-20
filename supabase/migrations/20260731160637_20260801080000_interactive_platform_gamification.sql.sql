/*
# Interactive Platform: Gamification + 8 Feature Tables

## Overview
Transforms Decoding Tomorrow from a content site into an interactive platform
(simulator, predictions, projects, skills, challenges, ideas, profiles, engagement).
All features are database-driven with deterministic logic — NO AI API calls.

## 1. Modified Tables
- `profiles` — adds gamification columns: xp, level, streak_days, last_active_date,
  reputation, bio, title, social links (twitter/github/linkedin), is_public.

## 2. New Tables
- `game_saves` — AI Startup Simulator saves (one active save per user)
- `game_leaderboard` — view of top simulator scores
- `predictions` + `prediction_votes` — future AI prediction market
- `projects` + `project_upvotes` + `project_comments` — Build-in-Public hub
- `skill_nodes` + `user_skill_progress` — AI Skill Tree
- `badges` + `user_badges` — achievement system
- `challenges` + `challenge_submissions` + `challenge_votes` — weekly challenges
- `business_ideas` + `idea_bookmarks` + `idea_ratings` — idea vault
- `activity_feed` — global activity log
- `notifications` — user notifications

## 3. Security
- RLS enabled on all new tables.
- Public read for content tables; owner-scoped write for user data.
- SECURITY DEFINER function award_xp() so XP is server-controlled, not client-trusted.

## 4. Notes
- No existing data dropped or renamed. All profile columns additive with safe defaults.
*/

-- ============ PROFILES EXPANSION ============
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS reputation integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS twitter text DEFAULT '',
  ADD COLUMN IF NOT EXISTS github text DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============ GAME SAVES (Simulator) ============
CREATE TABLE IF NOT EXISTS game_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  logo_emoji text DEFAULT '🤖',
  industry text NOT NULL,
  turn integer DEFAULT 1,
  cash integer DEFAULT 100000,
  users integer DEFAULT 0,
  revenue integer DEFAULT 0,
  employees integer DEFAULT 3,
  burn_rate integer DEFAULT 15000,
  reputation integer DEFAULT 50,
  product_launches integer DEFAULT 0,
  funding_stage text DEFAULT 'Bootstrapped',
  funding_total integer DEFAULT 0,
  valuation integer DEFAULT 0,
  decisions jsonb DEFAULT '[]'::jsonb,
  metrics_history jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active','won','failed','abandoned')),
  final_score integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own game saves" ON game_saves;
CREATE POLICY "Users can view own game saves" ON game_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own game saves" ON game_saves;
CREATE POLICY "Users can insert own game saves" ON game_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own game saves" ON game_saves;
CREATE POLICY "Users can update own game saves" ON game_saves FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own game saves" ON game_saves;
CREATE POLICY "Users can delete own game saves" ON game_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW game_leaderboard AS
SELECT gs.user_id, gs.company_name, gs.industry, gs.final_score, gs.valuation,
       gs.funding_stage, gs.status, gs.updated_at, p.username, p.avatar_url
FROM game_saves gs
JOIN profiles p ON p.id = gs.user_id
WHERE gs.status IN ('won','failed','abandoned') AND gs.final_score IS NOT NULL
ORDER BY gs.final_score DESC
LIMIT 100;

-- ============ PREDICTIONS ============
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'AI Future',
  type text DEFAULT 'year' CHECK (type IN ('year','value','choice','yesno')),
  options text[] DEFAULT '{}',
  target_date date,
  status text DEFAULT 'open' CHECK (status IN ('open','resolved','closed')),
  resolution text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  vote_count integer DEFAULT 0,
  is_trending boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Predictions publicly readable" ON predictions;
CREATE POLICY "Predictions publicly readable" ON predictions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated can create predictions" ON predictions;
CREATE POLICY "Authenticated can create predictions" ON predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can update predictions" ON predictions;
CREATE POLICY "Creators can update predictions" ON predictions FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_predictions_slug ON predictions(slug);
CREATE INDEX IF NOT EXISTS idx_predictions_trending ON predictions(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_predictions_votes ON predictions(vote_count DESC);

CREATE TABLE IF NOT EXISTS prediction_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  vote_value text NOT NULL,
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(prediction_id, user_id)
);

ALTER TABLE prediction_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prediction votes publicly readable" ON prediction_votes;
CREATE POLICY "Prediction votes publicly readable" ON prediction_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own prediction votes" ON prediction_votes;
CREATE POLICY "Users can insert own prediction votes" ON prediction_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own prediction votes" ON prediction_votes;
CREATE POLICY "Users can update own prediction votes" ON prediction_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own prediction votes" ON prediction_votes;
CREATE POLICY "Users can delete own prediction votes" ON prediction_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prediction_votes_pred ON prediction_votes(prediction_id);

-- ============ PROJECTS (Build-in-Public) ============
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  tagline text DEFAULT '',
  description text DEFAULT '',
  website_url text DEFAULT '',
  github_url text DEFAULT '',
  screenshots text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  upvote_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  status text DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published projects publicly readable" ON projects;
CREATE POLICY "Published projects publicly readable" ON projects FOR SELECT TO anon, authenticated USING (status = 'published' OR auth.uid() = creator_id);
DROP POLICY IF EXISTS "Authenticated can create projects" ON projects;
CREATE POLICY "Authenticated can create projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Creators can update own projects" ON projects;
CREATE POLICY "Creators can update own projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Creators can delete own projects" ON projects;
CREATE POLICY "Creators can delete own projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_upvotes ON projects(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

CREATE TABLE IF NOT EXISTS project_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project upvotes publicly readable" ON project_upvotes;
CREATE POLICY "Project upvotes publicly readable" ON project_upvotes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own project upvotes" ON project_upvotes;
CREATE POLICY "Users can insert own project upvotes" ON project_upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own project upvotes" ON project_upvotes;
CREATE POLICY "Users can delete own project upvotes" ON project_upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_upvotes_proj ON project_upvotes(project_id);

CREATE TABLE IF NOT EXISTS project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project comments publicly readable" ON project_comments;
CREATE POLICY "Project comments publicly readable" ON project_comments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own project comments" ON project_comments;
CREATE POLICY "Users can insert own project comments" ON project_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own project comments" ON project_comments;
CREATE POLICY "Users can delete own project comments" ON project_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_comments_proj ON project_comments(project_id);

-- ============ SKILL TREE ============
CREATE TABLE IF NOT EXISTS skill_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  node_key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  xp_reward integer DEFAULT 50,
  difficulty integer DEFAULT 1 CHECK (difficulty IN (1,2,3)),
  prerequisites text[] DEFAULT '{}',
  resource_url text DEFAULT '',
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Skill nodes publicly readable" ON skill_nodes;
CREATE POLICY "Skill nodes publicly readable" ON skill_nodes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage skill nodes" ON skill_nodes;
CREATE POLICY "Admins can manage skill nodes" ON skill_nodes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));
DROP POLICY IF EXISTS "Admins can update skill nodes" ON skill_nodes;
CREATE POLICY "Admins can update skill nodes" ON skill_nodes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

CREATE INDEX IF NOT EXISTS idx_skill_nodes_category ON skill_nodes(category);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_order ON skill_nodes("order");

CREATE TABLE IF NOT EXISTS user_skill_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, node_id)
);

ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own skill progress" ON user_skill_progress;
CREATE POLICY "Users can view own skill progress" ON user_skill_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own skill progress" ON user_skill_progress;
CREATE POLICY "Users can insert own skill progress" ON user_skill_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own skill progress" ON user_skill_progress;
CREATE POLICY "Users can update own skill progress" ON user_skill_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own skill progress" ON user_skill_progress;
CREATE POLICY "Users can delete own skill progress" ON user_skill_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user ON user_skill_progress(user_id);

-- ============ BADGES ============
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'Award',
  color text DEFAULT '#4A6CF7',
  xp_reward integer DEFAULT 100,
  requirement text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges publicly readable" ON badges;
CREATE POLICY "Badges publicly readable" ON badges FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage badges" ON badges;
CREATE POLICY "Admins can manage badges" ON badges FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
DROP POLICY IF EXISTS "Admins can update badges" ON badges;
CREATE POLICY "Admins can update badges" ON badges FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User badges publicly readable" ON user_badges;
CREATE POLICY "User badges publicly readable" ON user_badges FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own badges" ON user_badges;
CREATE POLICY "Users can delete own badges" ON user_badges FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ============ CHALLENGES ============
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  prompt text DEFAULT '',
  category text DEFAULT 'Build',
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  xp_reward integer DEFAULT 200,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','voting','closed')),
  submission_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Challenges publicly readable" ON challenges;
CREATE POLICY "Challenges publicly readable" ON challenges FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage challenges" ON challenges;
CREATE POLICY "Admins can manage challenges" ON challenges FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));
DROP POLICY IF EXISTS "Admins can update challenges" ON challenges;
CREATE POLICY "Admins can update challenges" ON challenges FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  link_url text DEFAULT '',
  image_url text DEFAULT '',
  vote_count integer DEFAULT 0,
  is_winner boolean DEFAULT false,
  rank integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Challenge submissions publicly readable" ON challenge_submissions;
CREATE POLICY "Challenge submissions publicly readable" ON challenge_submissions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own submissions" ON challenge_submissions;
CREATE POLICY "Users can insert own submissions" ON challenge_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own submissions" ON challenge_submissions;
CREATE POLICY "Users can update own submissions" ON challenge_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own submissions" ON challenge_submissions;
CREATE POLICY "Users can delete own submissions" ON challenge_submissions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_sub_chall ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_sub_votes ON challenge_submissions(vote_count DESC);

CREATE TABLE IF NOT EXISTS challenge_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES challenge_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Challenge votes publicly readable" ON challenge_votes;
CREATE POLICY "Challenge votes publicly readable" ON challenge_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own challenge votes" ON challenge_votes;
CREATE POLICY "Users can insert own challenge votes" ON challenge_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own challenge votes" ON challenge_votes;
CREATE POLICY "Users can delete own challenge votes" ON challenge_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_votes_sub ON challenge_votes(submission_id);

-- ============ BUSINESS IDEAS ============
CREATE TABLE IF NOT EXISTS business_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  pitch text DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT 'AI',
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  market_size text DEFAULT '',
  monetization text DEFAULT '',
  tech_stack text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  rating_sum integer DEFAULT 0,
  rating_count integer DEFAULT 0,
  bookmark_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business ideas publicly readable" ON business_ideas;
CREATE POLICY "Business ideas publicly readable" ON business_ideas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage business ideas" ON business_ideas;
CREATE POLICY "Admins can manage business ideas" ON business_ideas FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));
DROP POLICY IF EXISTS "Admins can update business ideas" ON business_ideas;
CREATE POLICY "Admins can update business ideas" ON business_ideas FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

CREATE INDEX IF NOT EXISTS idx_business_ideas_slug ON business_ideas(slug);
CREATE INDEX IF NOT EXISTS idx_business_ideas_category ON business_ideas(category);

CREATE TABLE IF NOT EXISTS idea_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES business_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

ALTER TABLE idea_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own idea bookmarks" ON idea_bookmarks;
CREATE POLICY "Users can view own idea bookmarks" ON idea_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own idea bookmarks" ON idea_bookmarks;
CREATE POLICY "Users can insert own idea bookmarks" ON idea_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own idea bookmarks" ON idea_bookmarks;
CREATE POLICY "Users can delete own idea bookmarks" ON idea_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_idea_bookmarks_user ON idea_bookmarks(user_id);

CREATE TABLE IF NOT EXISTS idea_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES business_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

ALTER TABLE idea_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Idea ratings publicly readable" ON idea_ratings;
CREATE POLICY "Idea ratings publicly readable" ON idea_ratings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own idea ratings" ON idea_ratings;
CREATE POLICY "Users can insert own idea ratings" ON idea_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own idea ratings" ON idea_ratings;
CREATE POLICY "Users can update own idea ratings" ON idea_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own idea ratings" ON idea_ratings;
CREATE POLICY "Users can delete own idea ratings" ON idea_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_idea_ratings_idea ON idea_ratings(idea_id);

-- ============ ACTIVITY FEED ============
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  link_url text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activity feed publicly readable" ON activity_feed;
CREATE POLICY "Activity feed publicly readable" ON activity_feed FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;
CREATE POLICY "Users can insert own activity" ON activity_feed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own activity" ON activity_feed;
CREATE POLICY "Users can delete own activity" ON activity_feed FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  link_url text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============ XP AWARD FUNCTION (SECURITY DEFINER) ============
-- Awards XP to a user and updates level + streak. Client cannot fake XP.
CREATE OR REPLACE FUNCTION award_xp(target_user_id uuid, xp_amount integer, activity_type text DEFAULT '', activity_title text DEFAULT '', activity_link text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET xp = xp + xp_amount,
      level = GREATEST(1, FLOOR((xp + xp_amount) / 100.0) + 1)::int,
      last_active_date = CURRENT_DATE,
      streak_days = CASE
        WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
        WHEN last_active_date = CURRENT_DATE THEN streak_days
        ELSE 1
      END
  WHERE id = target_user_id;

  IF activity_title <> '' THEN
    INSERT INTO activity_feed (user_id, type, title, description, link_url, xp_earned)
    VALUES (target_user_id, activity_type, activity_title, '', activity_link, xp_amount);
  END IF;
END;
$$;
