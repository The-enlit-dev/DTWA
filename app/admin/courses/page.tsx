'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, ExternalLink, GraduationCap, Users, X, Save, Loader2, ChevronDown, ChevronRight, BookOpen, FileText, Play, HelpCircle, Image as ImageIcon, Link as LinkIcon, Award } from 'lucide-react';
import Link from 'next/link';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseModules, setCourseModules] = useState<Record<string, any[]>>({});
  const [showModuleForm, setShowModuleForm] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState<{ moduleId: string; courseId: string } | null>(null);
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [tab, setTab] = useState<'courses' | 'instructors'>('courses');

  const [form, setForm] = useState({
    title: '', slug: '', description: '', short_description: '', thumbnail_url: '',
    instructor_id: '', difficulty: 'beginner', estimated_duration: '', category: '', tags: '', is_published: false,
  });

  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({
    title: '', content: '', content_type: 'text', external_url: '', file_url: '', image_url: '', duration_minutes: 0,
  });
  const [instructorForm, setInstructorForm] = useState({ user_id: '', name: '', bio: '', expertise: '', avatar_url: '' });
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';
  const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

  const fetchAll = async () => {
    const [courseRes, instrRes] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('course_instructors').select('*').order('created_at', { ascending: false }),
    ]);
    setCourses(courseRes.data || []);
    setInstructors(instrRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const saveCourse = async () => {
    if (!form.title) return;
    setSaving(true);
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description,
      short_description: form.short_description,
      thumbnail_url: form.thumbnail_url,
      instructor_id: form.instructor_id || null,
      difficulty: form.difficulty,
      estimated_duration: form.estimated_duration,
      category: form.category,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      is_published: form.is_published,
    };
    if (editingId) {
      await supabase.from('courses').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
    } else {
      await supabase.from('courses').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({ title: '', slug: '', description: '', short_description: '', thumbnail_url: '', instructor_id: '', difficulty: 'beginner', estimated_duration: '', category: '', tags: '', is_published: false });
    fetchAll();
  };

  const editCourse = (c: any) => {
    setEditingId(c.id);
    setForm({
      title: c.title, slug: c.slug, description: c.description || '', short_description: c.short_description || '',
      thumbnail_url: c.thumbnail_url || '', instructor_id: c.instructor_id || '', difficulty: c.difficulty,
      estimated_duration: c.estimated_duration || '', category: c.category || '', tags: (c.tags || []).join(', '), is_published: c.is_published,
    });
    setShowForm(true);
  };

  const delCourse = async (id: string) => {
    if (!confirm('Delete this course? All modules and lessons will be deleted too.')) return;
    await supabase.from('courses').delete().eq('id', id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleExpand = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    if (!courseModules[courseId]) {
      const { data } = await supabase
        .from('course_modules')
        .select('*, lessons:course_lessons(*)')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });
      const mods = (data || []).map((m: any) => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
      setCourseModules((prev) => ({ ...prev, [courseId]: mods }));
    }
  };

  const saveModule = async (courseId: string) => {
    if (!moduleForm.title) return;
    setSaving(true);
    const existing = courseModules[courseId] || [];
    await supabase.from('course_modules').insert({
      course_id: courseId,
      title: moduleForm.title,
      description: moduleForm.description,
      sort_order: existing.length,
    });
    setSaving(false);
    setShowModuleForm(null);
    setModuleForm({ title: '', description: '' });
    // Reload modules
    const { data } = await supabase
      .from('course_modules')
      .select('*, lessons:course_lessons(*)')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });
    const mods = (data || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
    setCourseModules((prev) => ({ ...prev, [courseId]: mods }));
  };

  const saveLesson = async (moduleId: string, courseId: string) => {
    if (!lessonForm.title) return;
    setSaving(true);
    const mods = courseModules[courseId] || [];
    const mod = mods.find((m) => m.id === moduleId);
    const lessonCount = mod?.lessons?.length || 0;
    await supabase.from('course_lessons').insert({
      module_id: moduleId,
      title: lessonForm.title,
      content: lessonForm.content,
      content_type: lessonForm.content_type,
      external_url: lessonForm.external_url,
      file_url: lessonForm.file_url,
      image_url: lessonForm.image_url,
      duration_minutes: Number(lessonForm.duration_minutes) || 0,
      sort_order: lessonCount,
    });
    setSaving(false);
    setShowLessonForm(null);
    setLessonForm({ title: '', content: '', content_type: 'text', external_url: '', file_url: '', image_url: '', duration_minutes: 0 });
    // Reload modules
    const { data } = await supabase
      .from('course_modules')
      .select('*, lessons:course_lessons(*)')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });
    const updatedMods = (data || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
    setCourseModules((prev) => ({ ...prev, [courseId]: updatedMods }));
  };

  const delModule = async (moduleId: string, courseId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    await supabase.from('course_modules').delete().eq('id', moduleId);
    setCourseModules((prev) => ({
      ...prev,
      [courseId]: (prev[courseId] || []).filter((m) => m.id !== moduleId),
    }));
  };

  const delLesson = async (lessonId: string, moduleId: string, courseId: string) => {
    if (!confirm('Delete this lesson?')) return;
    await supabase.from('course_lessons').delete().eq('id', lessonId);
    setCourseModules((prev) => ({
      ...prev,
      [courseId]: (prev[courseId] || []).map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) } : m
      ),
    }));
  };

  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role')
      .ilike('username', `%${q}%`)
      .limit(5);
    setSearchResults(data || []);
  };

  const saveInstructor = async () => {
    if (!instructorForm.name || !instructorForm.user_id) return;
    setSaving(true);
    await supabase.from('course_instructors').insert({
      user_id: instructorForm.user_id,
      name: instructorForm.name,
      bio: instructorForm.bio,
      expertise: instructorForm.expertise.split(',').map((s) => s.trim()).filter(Boolean),
      avatar_url: instructorForm.avatar_url,
    });
    setSaving(false);
    setShowInstructorForm(false);
    setInstructorForm({ user_id: '', name: '', bio: '', expertise: '', avatar_url: '' });
    fetchAll();
  };

  const delInstructor = async (id: string) => {
    if (!confirm('Remove this instructor?')) return;
    await supabase.from('course_instructors').delete().eq('id', id);
    setInstructors((prev) => prev.filter((i) => i.id !== id));
  };

  const contentTypeIcons: Record<string, any> = { text: FileText, video: Play, pdf: FileText, image: ImageIcon, quiz: HelpCircle, link: LinkIcon };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl text-white">Courses</h1>
        {tab === 'courses' ? (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        ) : (
          <button onClick={() => setShowInstructorForm(!showInstructorForm)} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Add Instructor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('courses')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'courses' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}>
          Courses ({courses.length})
        </button>
        <button onClick={() => setTab('instructors')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'instructors' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}>
          Instructors ({instructors.length})
        </button>
      </div>

      {/* Course form */}
      {showForm && tab === 'courses' && (
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">{editingId ? 'Edit Course' : 'New Course'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))} className={inputClass}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Instructor</label>
              <select value={form.instructor_id} onChange={(e) => setForm((p) => ({ ...p, instructor_id: e.target.value }))} className={inputClass}>
                <option value="">No instructor</option>
                {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Estimated Duration</label>
              <input type="text" value={form.estimated_duration} onChange={(e) => setForm((p) => ({ ...p, estimated_duration: e.target.value }))} placeholder="e.g. 4 weeks" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Short Description (for cards)</label>
              <input type="text" value={form.short_description} onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Full Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Thumbnail URL</label>
              <input type="url" value={form.thumbnail_url} onChange={(e) => setForm((p) => ({ ...p, thumbnail_url: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 rounded accent-brand-blue" />
                <span className="text-sm text-gray-300">Published (visible to public)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveCourse} disabled={saving} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editingId ? 'Update' : 'Add'} Course
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Instructor form */}
      {showInstructorForm && tab === 'instructors' && (
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">New Instructor</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 relative">
              <label className="text-xs text-gray-500 mb-1 block">Search User (by username)</label>
              <input type="text" value={userSearch} onChange={(e) => searchUsers(e.target.value)} placeholder="Type a username..." className={inputClass} />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full glass rounded-xl border border-white/10 max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button key={u.id} onClick={() => { setInstructorForm((p) => ({ ...p, user_id: u.id, name: u.username })); setSearchResults([]); setUserSearch(u.username); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm text-white flex items-center justify-between">
                      <span>{u.username}</span>
                      <span className="text-xs text-gray-500 capitalize">{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Display Name *</label>
              <input type="text" value={instructorForm.name} onChange={(e) => setInstructorForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Avatar URL</label>
              <input type="url" value={instructorForm.avatar_url} onChange={(e) => setInstructorForm((p) => ({ ...p, avatar_url: e.target.value }))} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Bio</label>
              <textarea value={instructorForm.bio} onChange={(e) => setInstructorForm((p) => ({ ...p, bio: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Expertise (comma-separated)</label>
              <input type="text" value={instructorForm.expertise} onChange={(e) => setInstructorForm((p) => ({ ...p, expertise: e.target.value }))} placeholder="Machine Learning, NLP" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveInstructor} disabled={saving || !instructorForm.user_id} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add Instructor
            </button>
            <button onClick={() => setShowInstructorForm(false)} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Courses list */}
      {tab === 'courses' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : courses.length === 0 ? (
            <div className="glass rounded-xl text-center py-12 text-gray-500 text-sm">No courses yet.</div>
          ) : courses.map((c) => (
            <div key={c.id} className="glass rounded-xl border border-white/8 overflow-hidden">
              {/* Course row */}
              <div className="flex items-center gap-4 p-4">
                <button onClick={() => toggleExpand(c.id)} className="p-1 text-gray-500 hover:text-white">
                  {expandedCourse === c.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <div className="w-10 h-10 rounded-lg bg-brand-blue/12 border border-brand-blue/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-brand-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{c.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600">
                    <span className="capitalize">{c.difficulty}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.enrollment_count}</span>
                    {c.is_published ? (
                      <span className="text-green-400">Published</span>
                    ) : (
                      <span className="text-gray-500">Draft</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/courses/${c.slug}`} target="_blank" className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => editCourse(c)} className="p-1.5 text-gray-500 hover:text-yellow-400 rounded-lg hover:bg-yellow-400/10">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => delCourse(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded module/lesson management */}
              {expandedCourse === c.id && (
                <div className="border-t border-white/5 p-4 space-y-3 bg-white/2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules & Lessons</h4>
                    <button onClick={() => setShowModuleForm(showModuleForm === c.id ? null : c.id)} className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-blue-300">
                      <Plus className="w-3.5 h-3.5" /> Add Module
                    </button>
                  </div>

                  {/* Module form */}
                  {showModuleForm === c.id && (
                    <div className="glass rounded-lg p-3 space-y-2 border border-white/8">
                      <input type="text" value={moduleForm.title} onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))} placeholder="Module title" className={inputClass} />
                      <input type="text" value={moduleForm.description} onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))} placeholder="Module description (optional)" className={inputClass} />
                      <div className="flex gap-2">
                        <button onClick={() => saveModule(c.id)} disabled={saving} className="btn-gradient px-4 py-2 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Module'}
                        </button>
                        <button onClick={() => setShowModuleForm(null)} className="px-4 py-2 text-gray-400 text-xs border border-white/10 rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Modules list */}
                  {(courseModules[c.id] || []).map((mod, mi) => (
                    <div key={mod.id} className="glass rounded-lg border border-white/8 overflow-hidden">
                      <div className="flex items-center gap-2 p-3">
                        <span className="text-xs font-bold text-gray-600 w-5">{mi + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">{mod.title}</p>
                          <p className="text-xs text-gray-600">{mod.lessons?.length || 0} lessons</p>
                        </div>
                        <button onClick={() => setShowLessonForm(showLessonForm?.moduleId === mod.id ? null : { moduleId: mod.id, courseId: c.id })} className="text-xs text-brand-blue hover:text-blue-300 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Lesson
                        </button>
                        <button onClick={() => delModule(mod.id, c.id)} className="p-1 text-gray-600 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Lesson form */}
                      {showLessonForm?.moduleId === mod.id && (
                        <div className="border-t border-white/5 p-3 space-y-2 bg-white/2">
                          <div className="grid sm:grid-cols-2 gap-2">
                            <input type="text" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} placeholder="Lesson title" className={inputClass} />
                            <select value={lessonForm.content_type} onChange={(e) => setLessonForm((p) => ({ ...p, content_type: e.target.value }))} className={inputClass}>
                              <option value="text">Text</option>
                              <option value="video">Video (embed)</option>
                              <option value="pdf">PDF</option>
                              <option value="image">Image</option>
                              <option value="quiz">Quiz</option>
                              <option value="link">External Link</option>
                            </select>
                          </div>
                          <textarea value={lessonForm.content} onChange={(e) => setLessonForm((p) => ({ ...p, content: e.target.value }))} placeholder="Lesson content / text" rows={3} className={`${inputClass} resize-none`} />
                          {(lessonForm.content_type === 'video' || lessonForm.content_type === 'link') && (
                            <input type="url" value={lessonForm.external_url} onChange={(e) => setLessonForm((p) => ({ ...p, external_url: e.target.value }))} placeholder="External URL (YouTube embed URL, etc.)" className={inputClass} />
                          )}
                          {(lessonForm.content_type === 'pdf') && (
                            <input type="url" value={lessonForm.file_url} onChange={(e) => setLessonForm((p) => ({ ...p, file_url: e.target.value }))} placeholder="PDF URL" className={inputClass} />
                          )}
                          {lessonForm.content_type === 'image' && (
                            <input type="url" value={lessonForm.image_url} onChange={(e) => setLessonForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="Image URL" className={inputClass} />
                          )}
                          <input type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))} placeholder="Duration (minutes)" min={0} className={inputClass} />
                          <div className="flex gap-2">
                            <button onClick={() => saveLesson(mod.id, c.id)} disabled={saving} className="btn-gradient px-4 py-2 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Lesson'}
                            </button>
                            <button onClick={() => setShowLessonForm(null)} className="px-4 py-2 text-gray-400 text-xs border border-white/10 rounded-lg">Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Lessons list */}
                      {mod.lessons?.map((lesson: any, li: number) => {
                        const Icon = contentTypeIcons[lesson.content_type] || FileText;
                        return (
                          <div key={lesson.id} className="flex items-center gap-2 px-3 py-2 border-t border-white/3 hover:bg-white/2">
                            <Icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="text-xs text-gray-600">{li + 1}.</span>
                            <span className="text-sm text-gray-300 flex-1 truncate">{lesson.title}</span>
                            <span className="text-[10px] text-gray-600 uppercase">{lesson.content_type}</span>
                            <button onClick={() => delLesson(lesson.id, mod.id, c.id)} className="p-1 text-gray-600 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {(courseModules[c.id] || []).length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-4">No modules yet. Add one to start building lessons.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructors list */}
      {tab === 'instructors' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instructors.map((instr) => (
            <div key={instr.id} className="glass rounded-xl p-4 border border-white/8">
              <div className="flex items-start gap-3">
                {instr.avatar_url ? (
                  <img src={instr.avatar_url} alt={instr.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-blue font-bold">
                    {instr.name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{instr.name}</h3>
                  {instr.expertise?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{instr.expertise.join(', ')}</p>
                  )}
                  {instr.bio && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{instr.bio}</p>}
                </div>
                <button onClick={() => delInstructor(instr.id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {instructors.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500 text-sm">No instructors yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
