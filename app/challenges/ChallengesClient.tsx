'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Challenge, ChallengeSubmission } from '@/lib/types';
import {
  Rocket,
  Trophy,
  Calendar,
  ArrowRight,
  Vote,
  Flame,
  Award,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface ChallengeWithSubs extends Challenge {
  submissions: ChallengeSubmission[];
}

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  voting: 1,
  upcoming: 2,
  closed: 3,
};

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: typeof Rocket }
> = {
  active: { label: 'Active', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: Flame },
  voting: { label: 'Voting Open', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Vote },
  upcoming: { label: 'Upcoming', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Calendar },
  closed: { label: 'Closed', color: 'text-gray-500 bg-white/5 border-white/8', icon: Trophy },
};

const DIFFICULTY_META: Record<string, string> = {
  easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  hard: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export function ChallengesClient({ challenges }: { challenges: ChallengeWithSubs[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [submittingChallenge, setSubmittingChallenge] = useState<string | null>(null);
  const [votingSubmission, setVotingSubmission] = useState<string | null>(null);
  const [submitForms, setSubmitForms] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, { title: string; description: string; link_url: string }>>({});

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        // Fetch the user's existing votes on challenge submissions
        const { data: myVotes } = await supabase
          .from('challenge_votes')
          .select('submission_id')
          .eq('user_id', session.user.id);
        if (myVotes) {
          setUserVotes(new Set(myVotes.map((v: any) => v.submission_id)));
        }
      }
    })();
  }, []);

  const sortedChallenges = [...challenges].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 99;
    const sb = STATUS_ORDER[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleSubmit = async (challenge: ChallengeWithSubs) => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    const data = formData[challenge.id];
    if (!data?.title?.trim()) return;

    setSubmittingChallenge(challenge.id);
    const { error } = await supabase.from('challenge_submissions').insert({
      challenge_id: challenge.id,
      user_id: userId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      link_url: data.link_url?.trim() || '',
    });

    if (!error) {
      await supabase.rpc('award_xp', {
        target_user_id: userId,
        xp_amount: challenge.xp_reward,
        activity_type: 'challenge_submit',
        activity_title: `Submitted: ${data.title.trim()}`,
        activity_link: '/challenges',
      });
      setSubmitForms({ ...submitForms, [challenge.id]: false });
      setFormData({ ...formData, [challenge.id]: { title: '', description: '', link_url: '' } });
      router.refresh();
    }
    setSubmittingChallenge(null);
  };

  const toggleVote = async (submission: ChallengeSubmission) => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    setVotingSubmission(submission.id);
    const hasVoted = userVotes.has(submission.id);
    if (hasVoted) {
      await supabase
        .from('challenge_votes')
        .delete()
        .eq('submission_id', submission.id)
        .eq('user_id', userId);
      const next = new Set(userVotes);
      next.delete(submission.id);
      setUserVotes(next);
    } else {
      const { error } = await supabase
        .from('challenge_votes')
        .insert({ submission_id: submission.id, user_id: userId });
      if (!error) {
        const next = new Set(userVotes);
        next.add(submission.id);
        setUserVotes(next);
      }
    }
    setVotingSubmission(null);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {sortedChallenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          userId={userId}
          submitFormOpen={submitForms[challenge.id] || false}
          formData={formData[challenge.id] || { title: '', description: '', link_url: '' }}
          submitting={submittingChallenge === challenge.id}
          votingSubmission={votingSubmission}
          userVotes={userVotes}
          onToggleForm={() =>
            setSubmitForms({
              ...submitForms,
              [challenge.id]: !submitForms[challenge.id],
            })
          }
          onFormChange={(field, value) =>
            setFormData({
              ...formData,
              [challenge.id]: {
                ...(formData[challenge.id] || { title: '', description: '', link_url: '' }),
                [field]: value,
              },
            })
          }
          onSubmit={() => handleSubmit(challenge)}
          onVote={toggleVote}
        />
      ))}

      {sortedChallenges.length === 0 && (
        <div className="text-center py-20">
          <Rocket className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No challenges yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({
  challenge,
  userId,
  submitFormOpen,
  formData,
  submitting,
  votingSubmission,
  userVotes,
  onToggleForm,
  onFormChange,
  onSubmit,
  onVote,
}: {
  challenge: ChallengeWithSubs;
  userId: string | null;
  submitFormOpen: boolean;
  formData: { title: string; description: string; link_url: string };
  submitting: boolean;
  votingSubmission: string | null;
  userVotes: Set<string>;
  onToggleForm: () => void;
  onFormChange: (field: 'title' | 'description' | 'link_url', value: string) => void;
  onSubmit: () => void;
  onVote: (submission: ChallengeSubmission) => void;
}) {
  const statusMeta = STATUS_META[challenge.status] || STATUS_META.closed;
  const StatusIcon = statusMeta.icon;
  const isActive = challenge.status === 'active';
  const isVoting = challenge.status === 'voting';
  const isFeatured = challenge.status === 'active';

  return (
    <div
      id={challenge.slug}
      className={`glass rounded-2xl p-6 md:p-7 ${
        isFeatured ? 'ring-1 ring-brand-blue/30 shadow-brand' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 ${statusMeta.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusMeta.label}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue font-medium">
              {challenge.category}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${DIFFICULTY_META[challenge.difficulty]}`}
            >
              {challenge.difficulty}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white mb-2">
            {challenge.title}
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">{challenge.description}</p>
        </div>

        {/* XP + count badge column */}
        <div className="flex md:flex-col items-center md:items-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue/10 border border-brand-blue/20">
            <Award className="w-4 h-4 text-brand-blue" />
            <span className="font-display font-bold text-brand-blue text-sm">
              {challenge.xp_reward} XP
            </span>
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div className="mb-5 p-3 rounded-xl bg-white/4 border border-white/6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Challenge Prompt</p>
        <p className="text-sm text-gray-300 leading-relaxed">{challenge.prompt}</p>
      </div>

      {/* Meta row: dates + submission count */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(challenge.starts_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
          {challenge.ends_at && (
            <>
              {' — '}
              {new Date(challenge.ends_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" />
          {challenge.submission_count} {challenge.submission_count === 1 ? 'submission' : 'submissions'}
        </span>
        {challenge.ends_at && (isActive || isVoting) && (
          <span className="text-gray-500">
            {isActive ? 'Ends' : 'Voting ends'}{' '}
            {formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Submit form for active challenges */}
      {isActive && (
        <div className="mb-5">
          {!submitFormOpen ? (
            <button
              onClick={onToggleForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white text-sm font-medium transition-all"
            >
              <Rocket className="w-4 h-4" />
              Submit Your Entry
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-brand-800/60 border border-white/8 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  Submission Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => onFormChange('title', e.target.value)}
                  placeholder="Name your build or entry"
                  className="w-full px-3 py-2 rounded-lg bg-brand-900 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => onFormChange('description', e.target.value)}
                  placeholder="Describe what you built and how you approached the challenge"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-brand-900 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => onFormChange('link_url', e.target.value)}
                  placeholder="https://your-demo-or-repo.com"
                  className="w-full px-3 py-2 rounded-lg bg-brand-900 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={onSubmit}
                  disabled={submitting || !formData.title.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Submit & Earn {challenge.xp_reward} XP
                    </>
                  )}
                </button>
                <button
                  onClick={onToggleForm}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                {!userId && (
                  <span className="text-xs text-gray-600">Sign in required to submit</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top submissions for active/voting challenges */}
      {(isActive || isVoting) && challenge.submissions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">
              {isVoting ? 'Vote for the Best Entry' : 'Top Submissions'}
            </h3>
          </div>
          <div className="space-y-2">
            {challenge.submissions.map((sub, idx) => {
              const hasVoted = userVotes.has(sub.id);
              const isVotingThis = votingSubmission === sub.id;
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:border-white/12 transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-blue/15 text-brand-blue text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium truncate">{sub.title}</p>
                      {sub.is_winner && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-400 flex items-center gap-1 shrink-0">
                          <Trophy className="w-3 h-3" /> Winner
                        </span>
                      )}
                    </div>
                    {sub.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{sub.description}</p>
                    )}
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Submitted {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Vote button (voting phase) */}
                  {isVoting && (
                    <button
                      onClick={() => onVote(sub)}
                      disabled={isVotingThis}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                        hasVoted
                          ? 'bg-brand-blue/20 border-brand-blue/50 text-brand-blue'
                          : 'bg-brand-800 border-white/8 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {isVotingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Vote className="w-3.5 h-3.5" />
                      )}
                      {sub.vote_count}
                      {hasVoted && <ChevronRight className="w-3 h-3" />}
                    </button>
                  )}

                  {/* Vote count only (active phase — no voting yet) */}
                  {!isVoting && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/4 text-gray-400 shrink-0">
                      <Vote className="w-3.5 h-3.5" />
                      {sub.vote_count}
                    </span>
                  )}

                  {sub.link_url && (
                    <a
                      href={sub.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-brand-blue transition-colors shrink-0"
                      aria-label="View submission"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          {!userId && isVoting && (
            <p className="text-xs text-gray-600 mt-2.5">Sign in to vote on submissions.</p>
          )}
        </div>
      )}

      {/* Closed challenge — archived winner(s) */}
      {challenge.status === 'closed' && challenge.submissions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Winners</h3>
          </div>
          <div className="space-y-2">
            {challenge.submissions
              .filter((s) => s.is_winner)
              .slice(0, 3)
              .map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6"
                >
                  <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{sub.title}</p>
                    {sub.description && (
                      <p className="text-xs text-gray-500 truncate">{sub.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {sub.vote_count} votes
                  </span>
                  {sub.link_url && (
                    <a
                      href={sub.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-brand-blue transition-colors shrink-0"
                      aria-label="View submission"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
