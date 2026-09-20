'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SkillNode, Badge, SkillQuizQuestion } from '@/lib/types';
import { levelTitle, xpProgressInLevel } from '@/lib/gamification';
import { Lock, Check, Star, Award, Zap, ChevronRight, Loader2, Flame, X, AlertCircle, Brain } from 'lucide-react';
import Link from 'next/link';

export function SkillsClient({ nodes, categories, badges, categoryEmojis, quizQuestions }: {
  nodes: SkillNode[];
  categories: Record<string, SkillNode[]>;
  badges: Badge[];
  categoryEmojis: Record<string, string>;
  quizQuestions: SkillQuizQuestion[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [profile, setProfile] = useState<any>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  // Quiz modal state
  const [quizNode, setQuizNode] = useState<SkillNode | null>(null);
  const [quizMode, setQuizMode] = useState<'quiz' | 'review'>('quiz');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const [progressRes, profileRes] = await Promise.all([
          supabase.from('user_skill_progress').select('node_id, completed').eq('user_id', session.user.id),
          supabase.from('profiles').select('xp, level, streak_days').eq('id', session.user.id).maybeSingle(),
        ]);
        const map: Record<string, boolean> = {};
        (progressRes.data || []).forEach((p: any) => { map[p.node_id] = p.completed; });
        setProgress(map);
        setProfile(profileRes.data);
      }
    })();
  }, []);

  const getQuizForNode = (node: SkillNode): SkillQuizQuestion | null => {
    return quizQuestions.find((q) => q.node_id === node.id) || null;
  };

  const openQuiz = (node: SkillNode) => {
    if (!userId) { router.push('/auth/login'); return; }
    const done = !!progress[node.id];
    setQuizNode(node);
    setQuizMode(done ? 'review' : 'quiz');
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(done);
  };

  const closeQuiz = () => {
    setQuizNode(null);
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
  };

  const submitAnswer = async () => {
    if (!quizNode || selectedOption === null) return;
    const quiz = getQuizForNode(quizNode);
    if (!quiz) return;

    setSubmitted(true);
    if (selectedOption === quiz.correct_index) {
      setIsCorrect(true);
      setShowExplanation(true);
      // Mark complete + award XP
      setCompleting(quizNode.id);
      await supabase.from('user_skill_progress').upsert({
        node_id: quizNode.id, user_id: userId, completed: true, completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,node_id' });
      setProgress({ ...progress, [quizNode.id]: true });
      await supabase.rpc('award_xp', {
        target_user_id: userId,
        xp_amount: quizNode.xp_reward,
        activity_type: 'skill_complete',
        activity_title: `Completed: ${quizNode.title}`,
        activity_link: '/skills',
      });
      setCompleting(null);
      router.refresh();
    } else {
      setIsCorrect(false);
      // Reset after a brief moment so they can retry
      setTimeout(() => {
        setSubmitted(false);
        setSelectedOption(null);
      }, 1500);
    }
  };

  const isNodeUnlocked = (node: SkillNode): boolean => {
    if (!userId) return true; // Preview mode for non-logged-in
    if (node.prerequisites.length === 0) return true;
    return node.prerequisites.every((key) => {
      const prereqNode = nodes.find((n) => n.node_key === key);
      return prereqNode ? progress[prereqNode.id] : false;
    });
  };

  const totalNodes = nodes.length;
  const completedCount = Object.values(progress).filter(Boolean).length;
  const overallPct = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

  const xpInfo = profile ? xpProgressInLevel(profile.xp || 0) : null;

  const activeQuiz = quizNode ? getQuizForNode(quizNode) : null;

  return (
    <div>
      {/* User progress overview */}
      {userId && profile && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-xl text-brand-blue">L{profile.level || 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-bold text-lg text-white">{levelTitle(profile.level || 1)}</span>
                {profile.streak_days > 0 && (
                  <span className="text-xs flex items-center gap-1 text-orange-400">
                    <Flame className="w-3 h-3" /> {profile.streak_days} day streak
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{profile.xp || 0} XP</span>
                <span>·</span>
                <span>{completedCount}/{totalNodes} skills completed</span>
              </div>
              {/* XP progress bar */}
              <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-blue to-brand-purple rounded-full transition-all" style={{ width: `${xpInfo?.percent || 0}%` }} />
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-2xl text-white">{overallPct}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Not signed in notice */}
      {!userId && (
        <div className="glass rounded-xl p-4 mb-8 text-center">
          <p className="text-sm text-gray-400">
            <Link href="/auth/login" className="text-brand-blue hover:underline">Sign in</Link> to track your progress and earn XP.
          </p>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" /> Achievements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {badges.map((badge) => (
              <div key={badge.id} className="glass rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${badge.color}20`, border: `1px solid ${badge.color}40` }}>
                  <Star className="w-5 h-5" style={{ color: badge.color }} />
                </div>
                <div className="text-xs font-semibold text-white">{badge.name}</div>
                <div className="text-[10px] text-gray-500 mt-1">+{badge.xp_reward} XP</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skill tree by category */}
      <div className="space-y-8">
        {Object.entries(categories).map(([category, catNodes]) => {
          const catCompleted = catNodes.filter((n) => progress[n.id]).length;
          const catPct = catNodes.length > 0 ? Math.round((catCompleted / catNodes.length) * 100) : 0;
          return (
            <section key={category}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryEmojis[category] || '🎯'}</span>
                  <h3 className="font-display font-bold text-lg text-white">{category}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-blue rounded-full transition-all" style={{ width: `${catPct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{catCompleted}/{catNodes.length}</span>
                </div>
              </div>

              {/* Skill nodes in a horizontal path */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {catNodes.map((node, i) => {
                  const unlocked = isNodeUnlocked(node);
                  const done = !!progress[node.id];
                  const hasQuiz = !!getQuizForNode(node);
                  return (
                    <div key={node.id} className="shrink-0 w-64">
                      {/* Connector line */}
                      {i > 0 && (
                        <div className="h-6 flex items-center justify-center -mb-1">
                          <div className={`w-px h-full ${done ? 'bg-brand-blue' : 'bg-white/10'}`} />
                        </div>
                      )}
                      <button
                        onClick={() => unlocked && hasQuiz ? openQuiz(node) : undefined}
                        disabled={!unlocked || completing === node.id}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          done
                            ? 'bg-brand-blue/10 border-brand-blue/40'
                            : unlocked
                            ? 'glass-hover border-white/8 cursor-pointer'
                            : 'bg-brand-800/30 border-white/4 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            done ? 'bg-brand-blue text-white' : unlocked ? 'bg-brand-700 text-gray-400' : 'bg-brand-800 text-gray-600'
                          }`}>
                            {done ? <Check className="w-4 h-4" /> : !unlocked ? <Lock className="w-3.5 h-3.5" /> : <Brain className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold ${done ? 'text-white' : 'text-gray-300'} truncate`}>{node.title}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-brand-blue">+{node.xp_reward} XP</span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className={`text-xs ${node.difficulty === 3 ? 'text-red-400' : node.difficulty === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {'★'.repeat(node.difficulty)}
                              </span>
                            </div>
                          </div>
                          {completing === node.id && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{node.description}</p>
                        {unlocked && !done && hasQuiz && (
                          <div className="mt-2 text-xs text-brand-blue flex items-center gap-1">
                            Take quiz <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                        {unlocked && !done && !hasQuiz && (
                          <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                            Quiz coming soon
                          </div>
                        )}
                        {done && (
                          <div className="mt-2 text-xs text-brand-blue/70 flex items-center gap-1">
                            Review <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Quiz Modal */}
      {quizNode && activeQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeQuiz}
        >
          <div
            className="glass rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  quizMode === 'review' ? 'bg-brand-blue text-white' : 'bg-brand-blue/20 border border-brand-blue/40 text-brand-blue'
                }`}>
                  {quizMode === 'review' ? <Check className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {quizMode === 'review' ? 'Review' : 'Skill Quiz'}
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">{quizNode.title}</h3>
                </div>
              </div>
              <button
                onClick={closeQuiz}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* XP reward badge */}
            {quizMode === 'quiz' && (
              <div className="flex items-center gap-1.5 mb-4 text-sm">
                <Zap className="w-4 h-4 text-brand-blue" />
                <span className="text-brand-blue font-semibold">+{quizNode.xp_reward} XP</span>
                <span className="text-gray-600">on correct answer</span>
              </div>
            )}

            {/* Question */}
            <div className="mb-5">
              <p className="text-white font-medium leading-relaxed">{activeQuiz.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-5">
              {activeQuiz.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const showCorrect = showExplanation && idx === activeQuiz.correct_index;
                const showWrong = submitted && isSelected && idx !== activeQuiz.correct_index;
                return (
                  <button
                    key={idx}
                    onClick={() => quizMode === 'quiz' && !submitted && setSelectedOption(idx)}
                    disabled={quizMode === 'review' || submitted}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      showCorrect
                        ? 'bg-green-500/15 border-green-500/50'
                        : showWrong
                        ? 'bg-red-500/15 border-red-500/50'
                        : isSelected
                        ? 'bg-brand-blue/15 border-brand-blue/50'
                        : quizMode === 'review'
                        ? 'bg-white/5 border-white/8 cursor-default'
                        : submitted
                        ? 'bg-white/5 border-white/8 cursor-default'
                        : 'glass-hover border-white/8 cursor-pointer'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      showCorrect
                        ? 'bg-green-500 text-white'
                        : showWrong
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-brand-blue text-white'
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {showCorrect ? <Check className="w-3.5 h-3.5" /> : showWrong ? <X className="w-3.5 h-3.5" /> : String.fromCharCode(65 + idx)}
                    </div>
                    <span className={`text-sm ${isSelected || showCorrect ? 'text-white' : 'text-gray-300'}`}>{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback / Explanation */}
            {quizMode === 'quiz' && submitted && !isCorrect && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm text-red-300">Not quite — try again!</span>
              </div>
            )}

            {showExplanation && (
              <div className="mb-5 p-4 rounded-xl bg-brand-blue/10 border border-brand-blue/30">
                <div className="flex items-center gap-2 mb-2">
                  {quizMode === 'quiz' && isCorrect ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-green-400">Correct!</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-brand-blue">Explanation</span>
                  )}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{activeQuiz.explanation}</p>
                {quizMode === 'quiz' && isCorrect && (
                  <div className="mt-3 flex items-center gap-1.5 text-sm">
                    <Zap className="w-4 h-4 text-brand-blue" />
                    <span className="text-brand-blue font-semibold">+{quizNode.xp_reward} XP earned!</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {quizMode === 'quiz' ? (
              !showExplanation ? (
                <div className="flex gap-3">
                  <button
                    onClick={closeQuiz}
                    className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAnswer}
                    disabled={selectedOption === null || submitted || completing === quizNode.id}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {completing === quizNode.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : submitted ? (
                      'Checking...'
                    ) : (
                      'Submit Answer'
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={closeQuiz}
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-sm transition-all"
                >
                  Done
                </button>
              )
            ) : (
              <button
                onClick={closeQuiz}
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz modal for node without a quiz (shouldn't normally trigger, but safety) */}
      {quizNode && !activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeQuiz}>
          <div className="glass rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-400 text-sm mb-4">No quiz available for this skill yet.</p>
            <button onClick={closeQuiz} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
