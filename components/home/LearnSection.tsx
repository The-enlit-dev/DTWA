'use client';

import Link from 'next/link';
import { BookOpen, GraduationCap, ArrowRight, FileText, Award, Users } from 'lucide-react';

export default function LearnSection() {
  return (
    <section>
      <div className="text-center mb-10">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
          Start <span className="gradient-text">Learning</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Free resources and interactive courses to help you master AI — from beginner concepts to advanced techniques.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Learning Hub card */}
        <Link
          href="/learning-hub"
          className="group glass rounded-3xl border border-white/8 hover:border-brand-blue/30 transition-all hover:-translate-y-1 overflow-hidden"
        >
          <div className="relative h-40 bg-gradient-to-br from-brand-blue/15 to-cyan-500/10 flex items-center justify-center overflow-hidden">
            <BookOpen className="w-16 h-16 text-brand-blue/40 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-brand-blue/10 border border-brand-blue/20 text-brand-blue">
                Free
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-brand-blue transition-colors">
              Learning Hub
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              A curated library of AI resources — PDFs, study notes, cheat sheets, guides, and research papers.
              Download, view online, and learn at your own pace.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> PDFs & Docs
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Study Notes
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm text-brand-blue group-hover:gap-2.5 transition-all">
              Explore Resources <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>

        {/* Courses card */}
        <Link
          href="/courses"
          className="group glass rounded-3xl border border-white/8 hover:border-purple-400/30 transition-all hover:-translate-y-1 overflow-hidden"
        >
          <div className="relative h-40 bg-gradient-to-br from-purple-500/15 to-brand-blue/10 flex items-center justify-center overflow-hidden">
            <GraduationCap className="w-16 h-16 text-purple-400/40 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-purple-400/10 border border-purple-400/20 text-purple-400">
                Interactive
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-purple-400 transition-colors">
              Interactive Courses
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Structured AI courses with video lessons, quizzes, hands-on projects, and completion certificates.
              Track your progress and level up your skills.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Certificates
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Progress Tracking
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm text-purple-400 group-hover:gap-2.5 transition-all">
              Browse Courses <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
