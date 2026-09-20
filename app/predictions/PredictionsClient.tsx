'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, Vote, ChevronRight, Loader2, Flame, Users,
  MessageSquare, Edit, X, Check, AlertCircle, Lightbulb,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MIN_REASONING = 20;

interface ReasoningSnippet {
  username: string;
  vote_value: string;
  reasoning: string;
  created_at: string;
}

interface PredictionWithConsensus {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  type: 'year' | 'value' | 'choice' | 'yesno';
  options: string[];
  target_date: string | null;
  status: 'open' | 'resolved' | 'closed';
  resolution: string | null;
  vote_count: number;
  is_trending: boolean;
  voteTally: Record<string, number>;
  totalVotes: number;
  topVote: [string, number] | null;
  reasoningSnippets: ReasoningSnippet[];
}

export function PredictionsClient({ predictions }: { predictions: PredictionWithConsensus[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  // userVotes: prediction_id -> { vote_value, reasoning }
  const [userVotes, setUserVotes] = useState<Record<string, { vote_value: string; reasoning: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null); // prediction id currently submitting
  const [filter, setFilter] = useState<'all' | 'trending' | 'open'>('all');

  // Reasoning panel state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState<string | null>(null); // prediction id being voted on
  const [reasoningText, setReasoningText] = useState('');
  const [submittingReasoning, setSubmittingReasoning] = useState(false);

  // edit mode flag for a given prediction id
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: existingVotes } = await supabase
          .from('prediction_votes')
          .select('prediction_id, vote_value, reasoning')
          .eq('user_id', session.user.id);
        const map: Record<string, { vote_value: string; reasoning: string }> = {};
        (existingVotes || []).forEach((v: any) => {
          map[v.prediction_id] = { vote_value: v.vote_value, reasoning: v.reasoning ?? '' };
        });
        setUserVotes(map);
      }
    })();
  }, []);

  const openReasoningPanel = (prediction: PredictionWithConsensus, option: string) => {
    if (!userId) { router.push('/auth/login'); return; }
    // If editing an existing vote, prefill the reasoning
    const existing = userVotes[prediction.id];
    setSelectedOption(option);
    setShowReasoning(prediction.id);
    setEditingId(existing ? prediction.id : null);
    setReasoningText(existing?.reasoning ?? '');
  };

  const cancelReasoning = () => {
    setShowReasoning(null);
    setSelectedOption(null);
    setReasoningText('');
    setEditingId(null);
  };

  const submitForecast = async (prediction: PredictionWithConsensus) => {
    if (!userId) { router.push('/auth/login'); return; }
    if (reasoningText.trim().length < MIN_REASONING) return;
    if (!selectedOption) return;

    setSubmittingReasoning(true);
    setSubmitting(prediction.id);

    const existing = userVotes[prediction.id];
    let error: any = null;

    if (existing) {
      // Update existing vote
      ({ error } = await supabase
        .from('prediction_votes')
        .update({ vote_value: selectedOption, reasoning: reasoningText.trim() })
        .eq('prediction_id', prediction.id)
        .eq('user_id', userId));
    } else {
      // Insert new vote
      ({ error } = await supabase
        .from('prediction_votes')
        .insert({
          prediction_id: prediction.id,
          user_id: userId,
          vote_value: selectedOption,
          reasoning: reasoningText.trim(),
        }));
      // Award XP only on the first vote (not on edits)
      if (!error) {
        await supabase.rpc('award_xp', {
          target_user_id: userId,
          xp_amount: 25,
          activity_type: 'prediction_vote',
          activity_title: `Voted on: ${prediction.title}`,
          activity_link: '/predictions',
        });
      }
    }

    if (!error) {
      setUserVotes({
        ...userVotes,
        [prediction.id]: { vote_value: selectedOption, reasoning: reasoningText.trim() },
      });
      cancelReasoning();
      router.refresh();
    }

    setSubmittingReasoning(false);
    setSubmitting(null);
  };

  const startEdit = (prediction: PredictionWithConsensus) => {
    const existing = userVotes[prediction.id];
    if (!existing) return;
    openReasoningPanel(prediction, existing.vote_value);
  };

  const filtered = predictions.filter((p) => {
    if (filter === 'trending') return p.is_trending;
    if (filter === 'open') return p.status === 'open';
    return true;
  });

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-8">
        {(['all', 'trending', 'open'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f ? 'bg-brand-blue text-white' : 'glass text-gray-400 hover:text-white border border-white/8'
            }`}
          >
            {f === 'all' ? 'All Predictions' : f}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {filtered.map((p) => (
          <PredictionCard
            key={p.id}
            prediction={p}
            userVote={userVotes[p.id]}
            submitting={submitting === p.id}
            signedIn={!!userId}
            showReasoning={showReasoning === p.id}
            selectedOption={showReasoning === p.id ? selectedOption : null}
            reasoningText={showReasoning === p.id ? reasoningText : ''}
            submittingReasoning={submittingReasoning && showReasoning === p.id}
            onOptionClick={(opt) => openReasoningPanel(p, opt)}
            onReasoningChange={setReasoningText}
            onSubmitForecast={() => submitForecast(p)}
            onCancelReasoning={cancelReasoning}
            onEdit={() => startEdit(p)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-16">No predictions found.</p>
      )}
    </div>
  );
}

function ReasoningPanel({
  selectedOption,
  reasoningText,
  onChange,
  onSubmit,
  onCancel,
  submitting,
}: {
  selectedOption: string;
  reasoningText: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const length = reasoningText.trim().length;
  const valid = length >= MIN_REASONING;

  return (
    <div className="mt-3 p-4 rounded-xl bg-brand-800/60 border border-brand-blue/20">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-white flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-brand-blue" />
          Why do you think <span className="text-brand-blue font-medium">{selectedOption}</span>?
          Explain your reasoning
        </p>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={reasoningText}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        autoFocus
        placeholder="Make your case. What signals, trends, or evidence support this forecast?"
        className="w-full bg-brand-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-blue/50 focus:outline-none resize-none"
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs">
          {valid ? (
            <span className="text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready to submit
            </span>
          ) : (
            <span className={`flex items-center gap-1 ${length > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
              <AlertCircle className="w-3 h-3" />
              {length}/{MIN_REASONING} min characters
            </span>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={!valid || submitting}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            valid && !submitting
              ? 'bg-brand-blue text-white hover:bg-brand-blue/80'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><Vote className="w-4 h-4" /> Submit Forecast</>
          )}
        </button>
      </div>
    </div>
  );
}

function ReasoningSnippetRow({ snippet }: { snippet: ReasoningSnippet }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = snippet.reasoning.length > 160;
  const display = expanded || !isLong ? snippet.reasoning : `${snippet.reasoning.slice(0, 160)}`;

  return (
    <div className="py-2 border-b border-white/5 last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-brand-blue">{snippet.username}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{snippet.vote_value}</span>
        <span className="text-xs text-gray-600">
          {formatDistanceToNow(new Date(snippet.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">
        {display}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-brand-blue hover:underline text-xs"
          >
            {expanded ? 'show less' : '...'}
          </button>
        )}
      </p>
    </div>
  );
}

function PredictionCard({
  prediction,
  userVote,
  submitting,
  signedIn,
  showReasoning,
  selectedOption,
  reasoningText,
  submittingReasoning,
  onOptionClick,
  onReasoningChange,
  onSubmitForecast,
  onCancelReasoning,
  onEdit,
}: {
  prediction: PredictionWithConsensus;
  userVote?: { vote_value: string; reasoning: string };
  submitting: boolean;
  signedIn: boolean;
  showReasoning: boolean;
  selectedOption: string | null;
  reasoningText: string;
  submittingReasoning: boolean;
  onOptionClick: (val: string) => void;
  onReasoningChange: (v: string) => void;
  onSubmitForecast: () => void;
  onCancelReasoning: () => void;
  onEdit: () => void;
}) {
  const { type, options, voteTally, totalVotes, topVote, reasoningSnippets } = prediction;

  // Generate input options based on type
  const inputOptions: string[] =
    type === 'choice' ? options
    : type === 'yesno' ? ['Yes', 'No']
    : type === 'year' ? ['2026', '2027', '2028', '2029', '2030', '2035+', 'Never']
    : [];

  return (
    <div id={prediction.slug} className="glass rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue font-medium">
              {prediction.category}
            </span>
            {prediction.is_trending && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Trending
              </span>
            )}
            {prediction.status === 'resolved' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">Resolved: {prediction.resolution}</span>
            )}
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-1.5">{prediction.title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{prediction.description}</p>
        </div>
      </div>

      {/* Consensus */}
      {totalVotes > 0 && topVote && (
        <div className="mb-4 p-3 bg-white/4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">Community Consensus ({totalVotes} votes)</span>
          </div>
          {inputOptions.map((opt) => {
            const count = voteTally[opt] || 0;
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            return (
              <div key={opt} className="mb-1.5">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className={opt === topVote[0] ? 'text-white font-medium' : 'text-gray-500'}>{opt}</span>
                  <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${opt === topVote[0] ? 'bg-brand-blue' : 'bg-gray-600'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reasoning snippets from other users */}
      {reasoningSnippets.length > 0 && (
        <div className="mb-4 p-3 bg-white/4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">Community Reasoning</span>
          </div>
          {reasoningSnippets.map((s, i) => (
            <ReasoningSnippetRow key={i} snippet={s} />
          ))}
        </div>
      )}

      {/* Vote buttons */}
      {prediction.status === 'open' && (
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Vote className="w-3 h-3" /> {signedIn ? 'Your forecast:' : 'Sign in to vote:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {inputOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => onOptionClick(opt)}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  userVote?.vote_value === opt
                    ? 'bg-brand-blue/20 border-brand-blue/50 text-brand-blue'
                    : 'bg-brand-800 border-white/8 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {opt}
                {userVote?.vote_value === opt && <ChevronRight className="w-3 h-3 inline ml-1" />}
              </button>
            ))}
            {submitting && <Loader2 className="w-4 h-4 animate-spin text-gray-500 self-center" />}
          </div>

          {/* Reasoning panel — expands below the buttons when an option is clicked */}
          {showReasoning && selectedOption && (
            <ReasoningPanel
              selectedOption={selectedOption}
              reasoningText={reasoningText}
              onChange={onReasoningChange}
              onSubmit={onSubmitForecast}
              onCancel={onCancelReasoning}
              submitting={submittingReasoning}
            />
          )}
        </div>
      )}

      {/* Your Forecast — shows after submitting, with Edit button */}
      {prediction.status === 'open' && userVote && !showReasoning && (
        <div className="mt-4 p-3 rounded-xl bg-brand-blue/8 border border-brand-blue/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-brand-blue flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Your Forecast: {userVote.vote_value}
            </span>
            <button
              onClick={onEdit}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Edit className="w-3 h-3" /> Edit
            </button>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed italic">{userVote.reasoning}</p>
        </div>
      )}

      {prediction.target_date && (
        <p className="text-xs text-gray-600 mt-3">Resolves by {new Date(prediction.target_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
      )}
    </div>
  );
}
