/*
  # Security hardening

  1. Fix mutable search_path on both SECURITY DEFINER functions
     - Recreate with SET search_path = '' and fully-qualified table names

  2. Revoke public EXECUTE on trigger function handle_new_user
     - It is invoked by a trigger only; direct RPC calls must be blocked

  3. Revoke anon EXECUTE on increment_view_count
     - Only authenticated sessions (server-side calls) should increment counts

  4. Replace always-true INSERT policies on public submission tables
     with non-trivial WITH CHECK clauses that validate required fields
*/

-- ── 1. FIX SEARCH PATH ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_view_count(table_name text, record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF table_name = 'articles' THEN
    UPDATE public.articles SET view_count = view_count + 1 WHERE id = record_id;
  ELSIF table_name = 'videos' THEN
    UPDATE public.videos SET view_count = view_count + 1 WHERE id = record_id;
  ELSIF table_name = 'ai_tools' THEN
    UPDATE public.ai_tools SET view_count = view_count + 1 WHERE id = record_id;
  ELSIF table_name = 'companies' THEN
    UPDATE public.companies SET view_count = view_count + 1 WHERE id = record_id;
  END IF;
END;
$$;

-- ── 2. REVOKE EXECUTE ON TRIGGER FUNCTION ───────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ── 3. RESTRICT increment_view_count TO AUTHENTICATED ONLY ──────────────────

REVOKE EXECUTE ON FUNCTION public.increment_view_count(text, uuid) FROM anon;
-- Keep authenticated so server-side / logged-in calls still work

-- ── 4. REPLACE ALWAYS-TRUE INSERT POLICIES ──────────────────────────────────

-- newsletter_subscribers
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) > 0
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- contact_messages
DROP POLICY IF EXISTS "Anyone can send messages" ON public.contact_messages;
CREATE POLICY "Anyone can send messages"
  ON public.contact_messages FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    length(trim(name))    > 0
    AND length(trim(email))   > 0
    AND length(trim(subject)) > 0
    AND length(trim(message)) > 0
  );

-- feedback
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    length(trim(subject)) > 0
    AND length(trim(message)) > 0
  );
