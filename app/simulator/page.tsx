'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  createInitialState, applyDecision, getAvailableDecisions, calculateScore,
  formatMoney, formatCount, INDUSTRIES, EMOJIS, MAX_TURNS, DECISIONS,
  type SimulatorState, type DecisionType,
} from '@/lib/gamification';
import { LeaderboardEntry } from '@/lib/types';
import {
  Gamepad2, Rocket, TrendingUp, Users, DollarSign, Building2, Star,
  ChevronRight, Loader2, Trophy, RotateCcw, Award, Zap, Flame,
} from 'lucide-react';
import Link from 'next/link';

export default function SimulatorPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SimulatorState | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [setupData, setSetupData] = useState({ name: '', emoji: '🤖', industry: 'chatbot' });
  const [acting, setActing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setSignedIn(true);
        // Try to load existing save
        const { data: save } = await supabase.from('game_saves').select('*').eq('user_id', session.user.id).maybeSingle();
        if (save && save.status === 'active') {
          const loaded: SimulatorState = {
            companyName: save.company_name,
            logoEmoji: save.logo_emoji,
            industry: save.industry,
            turn: save.turn,
            cash: save.cash,
            users: save.users,
            revenue: save.revenue,
            employees: save.employees,
            burnRate: save.burn_rate,
            reputation: save.reputation,
            productLaunches: save.product_launches,
            fundingStage: save.funding_stage,
            fundingTotal: save.funding_total,
            valuation: save.valuation,
            status: save.status,
            finalScore: save.final_score || 0,
            decisions: save.decisions || [],
            metricsHistory: save.metrics_history || [],
          };
          setState(loaded);
          setPhase('playing');
        }
      }
      setLoading(false);
    })();
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data } = await supabase.from('game_leaderboard').select('*').limit(10);
    setLeaderboard((data || []) as LeaderboardEntry[]);
  };

  const saveGame = useCallback(async (s: SimulatorState) => {
    if (!userId) return;
    await supabase.from('game_saves').upsert({
      user_id: userId,
      company_name: s.companyName,
      logo_emoji: s.logoEmoji,
      industry: s.industry,
      turn: s.turn,
      cash: s.cash,
      users: s.users,
      revenue: s.revenue,
      employees: s.employees,
      burn_rate: s.burnRate,
      reputation: s.reputation,
      product_launches: s.productLaunches,
      funding_stage: s.fundingStage,
      funding_total: s.fundingTotal,
      valuation: s.valuation,
      decisions: s.decisions,
      metrics_history: s.metricsHistory,
      status: s.status,
      final_score: s.finalScore || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [userId]);

  const startGame = async () => {
    if (!signedIn) { router.push('/auth/login'); return; }
    if (!setupData.name.trim()) return;
    const s = createInitialState(setupData.name.trim(), setupData.emoji, setupData.industry);
    setState(s);
    setPhase('playing');
    await saveGame(s);
    // Award XP for starting
    await supabase.rpc('award_xp', { target_user_id: userId, xp_amount: 10, activity_type: 'simulator_start', activity_title: 'Started a new game', activity_link: '/simulator' });
  };

  const makeDecision = async (type: DecisionType) => {
    if (!state || state.status !== 'active' || acting) return;
    setActing(true);
    const newState = applyDecision(state, type);
    setState(newState);
    await saveGame(newState);
    if (newState.status === 'won') {
      await supabase.rpc('award_xp', { target_user_id: userId, xp_amount: 500, activity_type: 'simulator_win', activity_title: `Won as ${newState.companyName}!`, activity_link: '/simulator' });
    } else if (newState.status === 'failed') {
      await supabase.rpc('award_xp', { target_user_id: userId, xp_amount: 50, activity_type: 'simulator_end', activity_title: `Game ended: ${newState.companyName}`, activity_link: '/simulator' });
    }
    setActing(false);
    if (newState.status !== 'active') {
      setPhase('gameover');
      loadLeaderboard();
    }
  };

  const restart = () => {
    setState(null);
    setPhase('setup');
    setSetupData({ name: '', emoji: '🤖', industry: 'chatbot' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-900">
      {/* Header */}
      <header className="bg-brand-800/50 border-b border-white/6 pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/play" className="text-sm text-gray-500 hover:text-white transition-colors mb-4 inline-block">← Play</Link>
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="w-6 h-6 text-brand-blue" />
            <h1 className="font-display font-bold text-3xl text-white">AI Startup Simulator</h1>
          </div>
          <p className="text-gray-400">Build a virtual AI company. 12 turns. Make or break your startup.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {phase === 'setup' && (
          <SetupPhase setupData={setupData} setSetupData={setSetupData} onStart={startGame} signedIn={signedIn} />
        )}

        {phase === 'playing' && state && (
          <PlayPhase state={state} onDecision={makeDecision} acting={acting} />
        )}

        {phase === 'gameover' && state && (
          <GameOverPhase state={state} onRestart={restart} leaderboard={leaderboard} />
        )}

        {/* Leaderboard sidebar (always visible) */}
        {phase !== 'setup' && leaderboard.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
            </h2>
            <div className="glass rounded-xl divide-y divide-white/6">
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <span className={`font-display font-bold w-7 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                    {i + 1}
                  </span>
                  <span className="text-lg">{entry.industry === 'chatbot' ? '💬' : entry.industry === 'coding' ? '💻' : '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{entry.company_name}</div>
                    <div className="text-xs text-gray-500">by {entry.username}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{formatMoney(entry.valuation)}</div>
                    <div className="text-xs text-gray-500">{entry.final_score} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SetupPhase({ setupData, setSetupData, onStart, signedIn }: {
  setupData: { name: string; emoji: string; industry: string };
  setSetupData: (d: { name: string; emoji: string; industry: string }) => void;
  onStart: () => void;
  signedIn: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass rounded-2xl p-8">
        <h2 className="font-display font-bold text-2xl text-white mb-2">Start Your AI Company</h2>
        <p className="text-gray-400 text-sm mb-8">You begin with $100K, 3 engineers, and 50 reputation. Build wisely.</p>

        {/* Company name */}
        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-2 font-medium">Company Name</label>
          <input
            type="text"
            value={setupData.name}
            onChange={(e) => setSetupData({ ...setupData, name: e.target.value })}
            maxLength={30}
            placeholder="e.g. NeuralForge AI"
            className="w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50 transition-colors"
          />
        </div>

        {/* Logo emoji */}
        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-2 font-medium">Pick Your Logo</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSetupData({ ...setupData, emoji })}
                className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${
                  setupData.emoji === emoji ? 'bg-brand-blue/20 border-brand-blue/50 scale-110' : 'bg-brand-800 border-white/8 hover:border-white/20'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div className="mb-8">
          <label className="block text-xs text-gray-400 mb-2 font-medium">Choose Your Industry</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.key}
                onClick={() => setSetupData({ ...setupData, industry: ind.key })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  setupData.industry === ind.key ? 'bg-brand-blue/15 border-brand-blue/40' : 'bg-brand-800 border-white/8 hover:border-white/20'
                }`}
              >
                <div className="text-2xl mb-1">{ind.emoji}</div>
                <div className="text-xs text-white font-medium">{ind.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!setupData.name.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-blue hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
        >
          <Rocket className="w-5 h-5" />
          {signedIn ? 'Launch Startup' : 'Sign in to Play'}
        </button>
      </div>
    </div>
  );
}

function PlayPhase({ state, onDecision, acting }: { state: SimulatorState; onDecision: (t: DecisionType) => void; acting: boolean }) {
  const available = getAvailableDecisions(state);
  const industry = INDUSTRIES.find((i) => i.key === state.industry);

  return (
    <div>
      {/* Company dashboard */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-brand-700 border border-white/10 flex items-center justify-center text-3xl">
            {state.logoEmoji}
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl text-white">{state.companyName}</h2>
            <p className="text-xs text-gray-500">{industry?.label} · {state.fundingStage}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Turn</div>
            <div className="font-display font-bold text-2xl text-white">{state.turn}<span className="text-sm text-gray-600">/{MAX_TURNS}</span></div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric icon={DollarSign} label="Cash" value={formatMoney(state.cash)} danger={state.cash < 30000} />
          <Metric icon={Users} label="Users" value={formatCount(state.users)} />
          <Metric icon={TrendingUp} label="Revenue" value={formatMoney(state.revenue)} />
          <Metric icon={Building2} label="Valuation" value={formatMoney(state.valuation)} />
          <Metric icon={Star} label="Reputation" value={`${state.reputation}/100`} />
          <Metric icon={Users} label="Team" value={`${state.employees} ppl`} />
          <Metric icon={Flame} label="Burn/mo" value={formatMoney(state.burnRate)} />
          <Metric icon={Rocket} label="Products" value={String(state.productLaunches)} />
        </div>
      </div>

      {/* Chart history */}
      {state.metricsHistory.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-white text-sm mb-4">Growth Trajectory</h3>
          <div className="flex items-end gap-2 h-32">
            {state.metricsHistory.map((m, i) => {
              const maxVal = Math.max(...state.metricsHistory.map((h) => h.valuation || h.users * 2 || 1), 1);
              const h = Math.max(4, ((m.valuation || m.users * 2) / maxVal) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gradient-to-t from-brand-blue/40 to-brand-blue rounded-t" style={{ height: `${h}%` }} />
                  <span className="text-[10px] text-gray-600">T{m.turn}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decisions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display font-bold text-lg text-white mb-1">What&apos;s your next move?</h3>
        <p className="text-xs text-gray-500 mb-5">Each decision advances the simulation one turn.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(DECISIONS) as DecisionType[]).map((key) => {
            const d = DECISIONS[key];
            const enabled = available.includes(key) && !acting;
            return (
              <button
                key={key}
                onClick={() => onDecision(key)}
                disabled={!enabled}
                className={`text-left p-4 rounded-xl border transition-all ${
                  enabled ? 'glass-hover border-white/8 hover:border-brand-blue/30 cursor-pointer' : 'bg-brand-800/30 border-white/4 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-brand-blue" />
                  <span className="font-semibold text-white text-sm">{d.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{d.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent decisions */}
      {state.decisions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-white text-sm mb-3">Decision History</h3>
          <div className="space-y-2">
            {state.decisions.slice(-5).reverse().map((d, i) => (
              <div key={i} className="glass rounded-lg px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-gray-600 w-8">T{d.turn}</span>
                <span className="text-sm text-white">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GameOverPhase({ state, onRestart, leaderboard }: {
  state: SimulatorState;
  onRestart: () => void;
  leaderboard: LeaderboardEntry[];
}) {
  const won = state.status === 'won';
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="glass rounded-2xl p-8">
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${won ? 'bg-green-500/15 border-2 border-green-500/40' : 'bg-red-500/15 border-2 border-red-500/40'}`}>
          {won ? <Trophy className="w-10 h-10 text-yellow-400" /> : <RotateCcw className="w-10 h-10 text-red-400" />}
        </div>
        <h2 className="font-display font-bold text-3xl text-white mb-2">
          {won ? 'You Built a Unicorn!' : 'Game Over'}
        </h2>
        <p className="text-gray-400 mb-6">
          {won
            ? `${state.companyName} reached a ${formatMoney(state.valuation)} valuation in ${state.turn - 1} turns.`
            : `${state.companyName} ran out of cash after ${state.turn - 1} turns.`}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Final Score</div>
            <div className="font-display font-bold text-2xl text-brand-blue">{state.finalScore}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Valuation</div>
            <div className="font-display font-bold text-2xl text-white">{formatMoney(state.valuation)}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Users</div>
            <div className="font-display font-bold text-2xl text-white">{formatCount(state.users)}</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
        >
          <Rocket className="w-5 h-5" /> Play Again
        </button>
      </div>

      {leaderboard.length > 0 && (
        <div className="mt-8 text-left">
          <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
          </h3>
          <div className="glass rounded-xl divide-y divide-white/6">
            {leaderboard.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <span className={`font-display font-bold w-7 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{entry.company_name}</div>
                  <div className="text-xs text-gray-500">by {entry.username}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{formatMoney(entry.valuation)}</div>
                  <div className="text-xs text-gray-500">{entry.final_score} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, danger }: { icon: any; label: string; value: string; danger?: boolean }) {
  return (
    <div className={`glass rounded-xl p-3 ${danger ? 'border-red-500/30' : ''}`}>
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`font-semibold text-sm ${danger ? 'text-red-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}
