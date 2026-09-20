/*
# Courses Platform Tables

1. New Tables
- `course_instructors`: Instructor profiles linked to users.
- `courses`: Course metadata (title, slug, difficulty, duration, category, tags, thumbnail).
- `course_modules`: Modules within a course.
- `course_lessons`: Lessons within modules (text, video, pdf, image, quiz, link content types).
- `course_quizzes`: Quizzes attached to lessons (questions stored as JSONB).
- `course_enrollments`: User enrollment tracking with progress percentage.
- `lesson_progress`: Per-lesson completion tracking with quiz scores.

2. Security
- Public read on published courses, modules, lessons, quizzes, and instructors.
- Authenticated users manage their own enrollments and lesson progress.
- Editors with 'courses' permission + admins can manage course content.
- Only admins can delete courses and manage instructors.
- SECURITY DEFINER functions for enrollment count increment and progress calculation.
*/

-- ============================================
-- COURSES: Instructors
-- ============================================
CREATE TABLE IF NOT EXISTS course_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  bio text DEFAULT '',
  expertise text[] DEFAULT '{}',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_instructors" ON course_instructors;
CREATE POLICY "public_read_instructors"
ON course_instructors FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_instructors" ON course_instructors;
CREATE POLICY "admin_manage_instructors"
ON course_instructors FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- COURSES: Courses
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  short_description text DEFAULT '',
  thumbnail_url text DEFAULT '',
  instructor_id uuid REFERENCES course_instructors(id) ON DELETE SET NULL,
  difficulty text DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration text DEFAULT '',
  category text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  enrollment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_courses" ON courses;
CREATE POLICY "public_read_published_courses"
ON courses FOR SELECT TO anon, authenticated
USING (is_published = true OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
));

DROP POLICY IF EXISTS "contributor_insert_courses" ON courses;
CREATE POLICY "contributor_insert_courses"
ON courses FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
);

DROP POLICY IF EXISTS "contributor_update_courses" ON courses;
CREATE POLICY "contributor_update_courses"
ON courses FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
);

DROP POLICY IF EXISTS "admin_delete_courses" ON courses;
CREATE POLICY "admin_delete_courses"
ON courses FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses (slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (is_published);

-- ============================================
-- COURSES: Modules
-- ============================================
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_modules" ON course_modules;
CREATE POLICY "public_read_modules"
ON course_modules FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM courses WHERE courses.id = course_modules.course_id
  AND (courses.is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
  ))
));

DROP POLICY IF EXISTS "contributor_manage_modules" ON course_modules;
CREATE POLICY "contributor_manage_modules"
ON course_modules FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules (course_id);

-- ============================================
-- COURSES: Lessons
-- ============================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'pdf', 'image', 'quiz', 'link')),
  external_url text DEFAULT '',
  file_url text DEFAULT '',
  image_url text DEFAULT '',
  duration_minutes integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_lessons" ON course_lessons;
CREATE POLICY "public_read_lessons"
ON course_lessons FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM course_modules
  JOIN courses ON courses.id = course_modules.course_id
  WHERE course_modules.id = course_lessons.module_id
  AND (courses.is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
  ))
));

DROP POLICY IF EXISTS "contributor_manage_lessons" ON course_lessons;
CREATE POLICY "contributor_manage_lessons"
ON course_lessons FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons (module_id);

-- ============================================
-- COURSES: Quizzes
-- ============================================
CREATE TABLE IF NOT EXISTS course_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  title text DEFAULT '',
  questions jsonb NOT NULL DEFAULT '[]',
  passing_score integer DEFAULT 70,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_quizzes" ON course_quizzes;
CREATE POLICY "public_read_quizzes"
ON course_quizzes FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM course_lessons
  JOIN course_modules ON course_modules.id = course_lessons.module_id
  JOIN courses ON courses.id = course_modules.course_id
  WHERE course_lessons.id = course_quizzes.lesson_id
  AND (courses.is_published = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
  ))
));

DROP POLICY IF EXISTS "contributor_manage_quizzes" ON course_quizzes;
CREATE POLICY "contributor_manage_quizzes"
ON course_quizzes FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (
    SELECT 1 FROM editor_permissions ep
    JOIN profiles p ON p.id = auth.uid()
    WHERE ep.user_id = auth.uid() AND ep.content_type = 'courses'
    AND p.role = 'editor'
  )
);

-- ============================================
-- COURSES: Enrollments
-- ============================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress numeric DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own_enrollments" ON course_enrollments;
CREATE POLICY "user_read_own_enrollments"
ON course_enrollments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_own_enrollment" ON course_enrollments;
CREATE POLICY "user_insert_own_enrollment"
ON course_enrollments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_own_enrollment" ON course_enrollments;
CREATE POLICY "user_update_own_enrollment"
ON course_enrollments FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_all_enrollments" ON course_enrollments;
CREATE POLICY "admin_read_all_enrollments"
ON course_enrollments FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments (course_id);

-- ============================================
-- COURSES: Lesson Progress
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  quiz_score integer,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own_progress" ON lesson_progress;
CREATE POLICY "user_read_own_progress"
ON lesson_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_own_progress" ON lesson_progress;
CREATE POLICY "user_insert_own_progress"
ON lesson_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_own_progress" ON lesson_progress;
CREATE POLICY "user_update_own_progress"
ON lesson_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress (lesson_id);

-- ============================================
-- SECURITY DEFINER: Increment course enrollment count
-- ============================================
CREATE OR REPLACE FUNCTION increment_course_enrollment(course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = course_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_course_enrollment(uuid) TO authenticated;

-- ============================================
-- SECURITY DEFINER: Update enrollment progress
-- ============================================
CREATE OR REPLACE FUNCTION update_course_progress(p_user_id uuid, p_course_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_lessons integer;
  completed_lessons integer;
  pct numeric;
BEGIN
  SELECT COUNT(*) INTO total_lessons
  FROM course_lessons cl
  JOIN course_modules cm ON cm.id = cl.module_id
  WHERE cm.course_id = p_course_id;

  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress lp
  JOIN course_lessons cl ON cl.id = lp.lesson_id
  JOIN course_modules cm ON cm.id = cl.module_id
  WHERE cm.course_id = p_course_id
  AND lp.user_id = p_user_id
  AND lp.completed = true;

  IF total_lessons = 0 THEN
    pct := 0;
  ELSE
    pct := ROUND((completed_lessons::numeric / total_lessons::numeric) * 100, 2);
  END IF;

  UPDATE course_enrollments
  SET progress = pct,
      completed_at = CASE WHEN pct = 100 THEN now() ELSE completed_at END
  WHERE user_id = p_user_id AND course_id = p_course_id;

  RETURN pct;
END;
$$;

GRANT EXECUTE ON FUNCTION update_course_progress(uuid, uuid) TO authenticated;
