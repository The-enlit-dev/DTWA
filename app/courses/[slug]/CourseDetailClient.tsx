'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  GraduationCap, Clock, Users, ArrowLeft, CheckCircle2, Circle, Play,
  FileText, Image as ImageIcon, ExternalLink, HelpCircle, Loader2,
  Award, ChevronDown, ChevronRight, BookOpen, Lock, Download
} from 'lucide-react';
import Link from 'next/link';

const contentTypeIcons: Record<string, any> = {
  text: FileText,
  video: Play,
  pdf: FileText,
  image: ImageIcon,
  quiz: HelpCircle,
  link: ExternalLink,
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CourseDetailClient({ slug }: { slug: string }) {
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [instructor, setInstructor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!courseData || !courseData.is_published) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCourse(courseData);

      // Fetch modules with lessons
      const { data: modData } = await supabase
        .from('course_modules')
        .select('*, lessons:course_lessons(*)')
        .eq('course_id', courseData.id)
        .order('sort_order', { ascending: true });

      const mods = (modData || []).map((m: any) => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
      setModules(mods);

      if (mods.length > 0 && mods[0].lessons?.length > 0) {
        setActiveModule(mods[0]);
        setActiveLesson(mods[0].lessons[0]);
        setExpandedModules(new Set([mods[0].id]));
      }

      // Fetch instructor
      if (courseData.instructor_id) {
        const { data: instr } = await supabase
          .from('course_instructors')
          .select('*')
          .eq('id', courseData.instructor_id)
          .maybeSingle();
        setInstructor(instr);
      }

      // Check auth and enrollment
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        const { data: enr } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('course_id', courseData.id)
          .maybeSingle();

        if (enr) {
          setEnrolled(true);
          setEnrollment(enr);

          // Fetch lesson progress
          const allLessonIds = mods.flatMap((m: any) => m.lessons?.map((l: any) => l.id) || []);
          if (allLessonIds.length > 0) {
            const { data: progData } = await supabase
              .from('lesson_progress')
              .select('lesson_id, completed, quiz_score')
              .eq('user_id', authUser.id)
              .in('lesson_id', allLessonIds);
            const map: Record<string, boolean> = {};
            (progData || []).forEach((p: any) => { map[p.lesson_id] = p.completed; });
            setProgressMap(map);
          }
        }
      }

      setLoading(false);
    })();
  }, [slug]);

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedLessons = Object.values(progressMap).filter(Boolean).length;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
    const { data } = await supabase
      .from('course_enrollments')
      .insert({ user_id: user.id, course_id: course.id })
      .select()
      .maybeSingle();

    if (data) {
      setEnrolled(true);
      setEnrollment(data);
      supabase.rpc('increment_course_enrollment', { course_id: course.id }).then(() => {});
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user || !enrolled) return;

    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('lesson_progress')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);
    } else {
      await supabase
        .from('lesson_progress')
        .insert({ user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() });
    }

    setProgressMap((prev) => ({ ...prev, [lessonId]: true }));

    // Update course progress
    const { data: progressData } = await supabase.rpc('update_course_progress', {
      p_user_id: user.id,
      p_course_id: course.id,
    });
    if (progressData !== null) {
      setEnrollment((prev: any) => ({ ...prev, progress: progressData }));
    }

    // Auto-advance to next lesson
    goToNextLesson(lessonId);
  };

  const goToNextLesson = (currentLessonId: string) => {
    let foundCurrent = false;
    for (const mod of modules) {
      for (const lesson of mod.lessons || []) {
        if (foundCurrent) {
          setActiveModule(mod);
          setActiveLesson(lesson);
          setExpandedModules((prev) => new Set([...prev, mod.id]));
          return;
        }
        if (lesson.id === currentLessonId) foundCurrent = true;
      }
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const selectLesson = (mod: any, lesson: any) => {
    setActiveModule(mod);
    setActiveLesson(lesson);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleQuizSubmit = async () => {
    if (!activeLesson?.quiz) return;
    const quiz = activeLesson.quiz;
    let correct = 0;
    quiz.questions.forEach((q: any, i: number) => {
      if (quizAnswers[i] === q.correct_index) correct++;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (score >= quiz.passing_score && user) {
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', activeLesson.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('lesson_progress')
          .update({ completed: true, quiz_score: score, completed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('lesson_id', activeLesson.id);
      } else {
        await supabase
          .from('lesson_progress')
          .insert({ user_id: user.id, lesson_id: activeLesson.id, completed: true, quiz_score: score, completed_at: new Date().toISOString() });
      }

      setProgressMap((prev) => ({ ...prev, [activeLesson.id]: true }));
      const { data: progressData } = await supabase.rpc('update_course_progress', {
        p_user_id: user.id,
        p_course_id: course.id,
      });
      if (progressData !== null) {
        setEnrollment((prev: any) => ({ ...prev, progress: progressData }));
      }
    }
  };

  const downloadCertificate = () => {
    if (!user || !course) return;
    const certText = `Certificate of Completion

This certifies that

${user.email}

has successfully completed the course

"${course.title}"

on Decoding Tomorrow With Attharva

Completion: ${Math.round(enrollment?.progress || 100)}%
Date: ${new Date().toLocaleDateString()}

Course ID: ${course.id}
Verify at: https://decodingtomorrowwithattharva.netlify.app/courses/${course.slug}`;
    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${course.slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fetch quiz for active lesson
  useEffect(() => {
    if (activeLesson && activeLesson.content_type === 'quiz') {
      supabase
        .from('course_quizzes')
        .select('*')
        .eq('lesson_id', activeLesson.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setActiveLesson((prev: any) => ({ ...prev, quiz: data }));
          }
        });
    }
  }, [activeLesson?.id, activeLesson?.content_type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <GraduationCap className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-white mb-3">Course Not Found</h1>
        <p className="text-gray-500 mb-6">This course may have been removed or is not yet published.</p>
        <Link href="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      {/* Course header */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-brand-blue/15 to-purple-500/10 flex items-center justify-center">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <GraduationCap className="w-16 h-16 text-brand-blue/40" />
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg border bg-brand-blue/10 border-brand-blue/20 text-brand-blue">
                  {difficultyLabels[course.difficulty]}
                </span>
                {course.category && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/8">
                    {course.category}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" /> {course.enrollment_count} enrolled
                </span>
                {course.estimated_duration && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" /> {course.estimated_duration}
                  </span>
                )}
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">{course.title}</h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">{course.description}</p>

              {instructor && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                  {instructor.avatar_url ? (
                    <img src={instructor.avatar_url} alt={instructor.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-blue font-bold">
                      {instructor.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{instructor.name}</p>
                    <p className="text-xs text-gray-500">{instructor.expertise?.join(', ') || 'Instructor'}</p>
                  </div>
                </div>
              )}

              {course.tags && course.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {course.tags.map((tag: string) => (
                    <span key={tag} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/8">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Enroll / Progress card */}
            <div className="lg:w-64 shrink-0">
              {!enrolled ? (
                <button
                  onClick={handleEnroll}
                  className="w-full px-5 py-3.5 btn-gradient text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
                >
                  {user ? 'Enroll for Free' : 'Sign in to Enroll'}
                </button>
              ) : (
                <div className="glass rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400">Your Progress</span>
                    <span className="text-xs font-bold text-brand-blue">{Math.round(enrollment?.progress || 0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className="h-full btn-gradient rounded-full transition-all" style={{ width: `${enrollment?.progress || 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 text-center">{completedLessons} of {totalLessons} lessons complete</p>
                  {progressPct === 100 && (
                    <button
                      onClick={downloadCertificate}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-semibold rounded-xl hover:bg-green-500/18 transition-colors"
                    >
                      <Award className="w-4 h-4" /> Download Certificate
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - module list */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Course Content</h2>
          {modules.map((mod, mi) => (
            <div key={mod.id} className="glass rounded-xl border border-white/8 overflow-hidden">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 text-left">
                  {expandedModules.has(mod.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{mi + 1}. {mod.title}</p>
                    <p className="text-xs text-gray-600">{mod.lessons?.length || 0} lessons</p>
                  </div>
                </div>
              </button>
              {expandedModules.has(mod.id) && (
                <div className="border-t border-white/5">
                  {mod.lessons?.map((lesson: any, li: number) => {
                    const Icon = contentTypeIcons[lesson.content_type] || FileText;
                    const isComplete = progressMap[lesson.id];
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(mod, lesson)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isActive ? 'bg-brand-blue/8' : 'hover:bg-white/3'
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-700 shrink-0" />
                        )}
                        <Icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className={`text-xs truncate ${isActive ? 'text-brand-blue' : 'text-gray-400'}`}>
                          {li + 1}. {lesson.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main lesson content */}
        <div className="lg:col-span-2">
          {activeLesson ? (
            <div className="glass rounded-2xl border border-white/8 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-white">{activeLesson.title}</h2>
                {activeLesson.duration_minutes > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" /> {activeLesson.duration_minutes} min
                  </span>
                )}
              </div>

              {/* Text content */}
              {activeLesson.content_type === 'text' && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson.content}</p>
                </div>
              )}

              {/* Video */}
              {activeLesson.content_type === 'video' && (
                <div className="rounded-xl overflow-hidden">
                  {activeLesson.external_url && (
                    <div className="aspect-video">
                      <iframe
                        src={activeLesson.external_url}
                        className="w-full h-full"
                        allowFullScreen
                        title={activeLesson.title}
                      />
                    </div>
                  )}
                  {activeLesson.content && (
                    <p className="text-gray-300 text-sm leading-relaxed mt-4 whitespace-pre-wrap">{activeLesson.content}</p>
                  )}
                </div>
              )}

              {/* PDF */}
              {activeLesson.content_type === 'pdf' && (
                <div className="space-y-3">
                  {activeLesson.file_url && (
                    <iframe src={activeLesson.file_url} className="w-full h-[500px] rounded-xl" title={activeLesson.title} />
                  )}
                  {activeLesson.content && (
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson.content}</p>
                  )}
                </div>
              )}

              {/* Image */}
              {activeLesson.content_type === 'image' && (
                <div className="space-y-3">
                  {activeLesson.image_url && (
                    <img src={activeLesson.image_url} alt={activeLesson.title} className="max-w-full rounded-xl" />
                  )}
                  {activeLesson.content && (
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson.content}</p>
                  )}
                </div>
              )}

              {/* External link */}
              {activeLesson.content_type === 'link' && (
                <div className="space-y-3">
                  <a
                    href={activeLesson.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-sm font-semibold rounded-xl hover:bg-brand-blue/18 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Open External Resource
                  </a>
                  {activeLesson.content && (
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson.content}</p>
                  )}
                </div>
              )}

              {/* Quiz */}
              {activeLesson.content_type === 'quiz' && (
                <div className="space-y-4">
                  {activeLesson.content && (
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{activeLesson.content}</p>
                  )}
                  {!activeLesson.quiz ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-brand-blue animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-5 h-5 text-brand-blue" />
                        <h3 className="font-display font-bold text-white">{activeLesson.quiz.title || 'Quiz'}</h3>
                        <span className="text-xs text-gray-500 ml-auto">Passing score: {activeLesson.quiz.passing_score}%</span>
                      </div>
                      {activeLesson.quiz.questions.map((q: any, qi: number) => (
                        <div key={qi} className="glass rounded-xl border border-white/8 p-4">
                          <p className="text-sm font-medium text-white mb-3">
                            {qi + 1}. {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((opt: string, oi: number) => {
                              const isSelected = quizAnswers[qi] === oi;
                              const isCorrect = oi === q.correct_index;
                              let showResult = quizSubmitted && isSelected;
                              let bgClass = 'bg-white/5 border-white/8 hover:border-white/18';
                              if (quizSubmitted) {
                                if (isCorrect) bgClass = 'bg-green-500/10 border-green-500/30 text-green-400';
                                else if (isSelected) bgClass = 'bg-red-500/10 border-red-500/30 text-red-400';
                                else bgClass = 'bg-white/3 border-white/5 opacity-60';
                              } else if (isSelected) {
                                bgClass = 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue';
                              }
                              return (
                                <button
                                  key={oi}
                                  onClick={() => !quizSubmitted && setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                  disabled={quizSubmitted}
                                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${bgClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {quizSubmitted && q.explanation && (
                            <p className="text-xs text-gray-400 mt-2 italic">Explanation: {q.explanation}</p>
                          )}
                        </div>
                      ))}

                      {!quizSubmitted ? (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length < (activeLesson.quiz.questions?.length || 0)}
                          className="px-5 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
                        >
                          Submit Quiz
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                            quizScore! >= activeLesson.quiz.passing_score
                              ? 'bg-green-500/10 border border-green-500/25 text-green-400'
                              : 'bg-red-500/10 border border-red-500/25 text-red-400'
                          }`}>
                            Score: {quizScore}% — {quizScore! >= activeLesson.quiz.passing_score ? 'Passed!' : 'Try again'}
                          </div>
                          {quizScore! < activeLesson.quiz.passing_score && (
                            <button
                              onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizScore(null); }}
                              className="px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 text-sm rounded-xl hover:text-white transition-colors"
                            >
                              Retake
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Mark complete button */}
              {enrolled && activeLesson.content_type !== 'quiz' && (
                <div className="pt-4 border-t border-white/5">
                  {progressMap[activeLesson.id] ? (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle2 className="w-4 h-4" /> Lesson completed
                    </div>
                  ) : (
                    <button
                      onClick={() => markLessonComplete(activeLesson.id)}
                      className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Complete
                    </button>
                  )}
                </div>
              )}

              {!enrolled && (
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lock className="w-4 h-4" /> Enroll to track your progress
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl border border-white/8 py-20 text-center">
              <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Select a lesson from the sidebar to start learning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
