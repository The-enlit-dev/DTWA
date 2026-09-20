'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, GraduationCap, Clock, BarChart, Users, X, Loader2, ArrowRight, BookOpen, Trophy } from 'lucide-react';
import Link from 'next/link';

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
  intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CoursesClient() {
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(100);

      const courses = data || [];
      setCourses(courses);

      // Fetch instructors
      const instructorIds = courses.map((c: any) => c.instructor_id).filter(Boolean);
      if (instructorIds.length > 0) {
        const { data: instrData } = await supabase
          .from('course_instructors')
          .select('*')
          .in('id', instructorIds);
        const map: Record<string, any> = {};
        (instrData || []).forEach((i: any) => { map[i.id] = i; });
        setInstructors(map);
      }

      // Check enrollments
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('user_id', user.id);
        setEnrolledCourses(new Set((enrollments || []).map((e: any) => e.course_id)));
      }

      setLoading(false);
    })();
  }, []);

  const allCategories = useMemo(() => {
    const catSet = new Set<string>();
    courses.forEach((c) => c.category && catSet.add(c.category));
    return Array.from(catSet).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    let result = [...courses];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.short_description?.toLowerCase().includes(q) ||
          c.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    if (selectedDifficulty !== 'all') {
      result = result.filter((c) => c.difficulty === selectedDifficulty);
    }
    if (selectedCategory !== 'all') {
      result = result.filter((c) => c.category === selectedCategory);
    }
    if (sortBy === 'popular') {
      result.sort((a, b) => b.enrollment_count - a.enrollment_count);
    }
    return result;
  }, [courses, search, selectedDifficulty, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-5">
          <GraduationCap className="w-3.5 h-3.5 text-brand-blue" />
          <span className="text-xs font-medium text-gray-300">{courses.length} free courses</span>
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
          Interactive <span className="gradient-text">Courses</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Learn AI through structured courses with video lessons, quizzes, hands-on projects, and completion certificates.
          Track your progress and earn achievements as you go.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-blue/50 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue/50 transition-all cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue/50 transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue/50 transition-all cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length} course{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Course cards */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/8 py-20 text-center">
          <GraduationCap className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No courses found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const instructor = course.instructor_id ? instructors[course.instructor_id] : null;
            const isEnrolled = enrolledCourses.has(course.id);
            return (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group glass rounded-2xl border border-white/8 hover:border-white/18 transition-all hover:-translate-y-1 overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-gradient-to-br from-brand-blue/15 to-purple-500/10 flex items-center justify-center overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <GraduationCap className="w-12 h-12 text-brand-blue/40" />
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${difficultyColors[course.difficulty]}`}>
                      {difficultyLabels[course.difficulty]}
                    </span>
                    {isEnrolled && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-green-400/10 border-green-400/20 text-green-400">
                        Enrolled
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  {course.category && (
                    <span className="text-[10px] font-semibold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md mb-2 self-start">
                      {course.category}
                    </span>
                  )}
                  <h3 className="font-display font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
                    {course.short_description || course.description}
                  </p>

                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {course.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      {instructor && (
                        <span className="flex items-center gap-1.5">
                          {instructor.avatar_url ? (
                            <img src={instructor.avatar_url} alt={instructor.name} className="w-4 h-4 rounded-full" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-brand-blue/20 flex items-center justify-center text-[8px] text-brand-blue font-bold">
                              {instructor.name?.charAt(0)}
                            </div>
                          )}
                          {instructor.name}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-brand-blue group-hover:gap-2 transition-all">
                      Start <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                    {course.estimated_duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {course.estimated_duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {course.enrollment_count}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
