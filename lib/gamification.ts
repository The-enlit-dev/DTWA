// Deterministic gamification + simulator logic.
// No AI/API calls — all calculations are pure functions.

// ============ XP & LEVELS ============

export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 50;

export function levelFromXp(xp: number): number {
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1));
}

export function xpForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXp(xp);
  const baseXp = xpForLevel(level);
  const current = xp - baseXp;
  const needed = XP_PER_LEVEL;
  return { current, needed, percent: Math.min(100, (current / needed) * 100) };
}

export function levelTitle(level: number): string {
  if (level >= 45) return 'AI Oracle';
  if (level >= 35) return 'AI Visionary';
  if (level >= 25) return 'AI Strategist';
  if (level >= 15) return 'AI Practitioner';
  if (level >= 8) return 'AI Builder';
  if (level >= 4) return 'AI Enthusiast';
  return 'AI Beginner';
}

// ============ STREAKS ============

export function streakStatus(lastActiveDate: string | null, streakDays: number): {
  active: boolean;
  atRisk: boolean;
  daysToBreak: number;
} {
  if (!lastActiveDate) return { active: false, atRisk: false, daysToBreak: 0 };
  const last = new Date(lastActiveDate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return {
    active: diffDays <= 1,
    atRisk: diffDays === 1 && streakDays > 0,
    daysToBreak: Math.max(0, 2 - diffDays),
  };
}

// ============ REPUTATION ============

export const REPUTATION_REWARDS = {
  project_upvoted: 2,
  project_published: 10,
  prediction_vote: 1,
  challenge_submission: 5,
  challenge_won: 50,
  idea_rated: 1,
  skill_completed: 3,
} as const;

// ============ STARTUP SIMULATOR ============

export interface SimulatorState {
  companyName: string;
  logoEmoji: string;
  industry: string;
  turn: number;
  cash: number;
  users: number;
  revenue: number;
  employees: number;
  burnRate: number;
  reputation: number;
  productLaunches: number;
  fundingStage: string;
  fundingTotal: number;
  valuation: number;
  status: 'active' | 'won' | 'failed' | 'abandoned';
  finalScore: number;
  decisions: SimulatorDecision[];
  metricsHistory: { turn: number; users: number; revenue: number; cash: number; valuation: number }[];
}

export interface SimulatorDecision {
  turn: number;
  type: string;
  label: string;
  effect: Record<string, number>;
}

export const INDUSTRIES = [
  { key: 'chatbot', label: 'AI Chatbot', emoji: '💬', growth: 1.3, competition: 0.7 },
  { key: 'computer-vision', label: 'Computer Vision', emoji: '👁️', growth: 1.2, competition: 0.5 },
  { key: 'ai-agent', label: 'AI Agents', emoji: '🤖', growth: 1.4, competition: 0.6 },
  { key: 'content', label: 'AI Content', emoji: '✍️', growth: 1.25, competition: 0.8 },
  { key: 'coding', label: 'AI Coding', emoji: '💻', growth: 1.35, competition: 0.75 },
  { key: 'healthcare', label: 'AI Healthcare', emoji: '🏥', growth: 1.15, competition: 0.3 },
  { key: 'fintech', label: 'AI Fintech', emoji: '💰', growth: 1.2, competition: 0.55 },
  { key: 'education', label: 'AI Education', emoji: '📚', growth: 1.18, competition: 0.4 },
] as const;

export const EMOJIS = ['🤖', '🚀', '💡', '⚡', '🧠', '🔮', '🌐', '🎯', '🛠️', '🦾'];

export const MAX_TURNS = 12;

export function createInitialState(companyName: string, logoEmoji: string, industry: string): SimulatorState {
  return {
    companyName,
    logoEmoji,
    industry,
    turn: 1,
    cash: 100000,
    users: 0,
    revenue: 0,
    employees: 3,
    burnRate: 15000,
    reputation: 50,
    productLaunches: 0,
    fundingStage: 'Bootstrapped',
    fundingTotal: 0,
    valuation: 0,
    status: 'active',
    finalScore: 0,
    decisions: [],
    metricsHistory: [],
  };
}

// Deterministic per-turn multiplier from a seed (turn number + company name hash)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export type DecisionType =
  | 'hire' | 'product_launch' | 'marketing' | 'pricing'
  | 'funding_round' | 'compete' | 'optimize';

export interface DecisionOption {
  type: DecisionType;
  label: string;
  description: string;
}

export const DECISIONS: Record<DecisionType, DecisionOption> = {
  hire: { type: 'hire', label: 'Hire Engineers', description: 'Hire 2 engineers to boost product velocity. Costs $20K upfront, increases burn by $12K/turn.' },
  product_launch: { type: 'product_launch', label: 'Launch Product', description: 'Ship a new feature. Costs $15K. Gains users if reputation is high enough.' },
  marketing: { type: 'marketing', label: 'Marketing Campaign', description: 'Spend $25K on marketing. Boosts user growth this turn based on spend.' },
  pricing: { type: 'pricing', label: 'Adjust Pricing', description: 'Increase prices to boost revenue per user, but may slow growth.' },
  funding_round: { type: 'funding_round', label: 'Raise Funding', description: 'Pitch investors. Success depends on traction and reputation.' },
  compete: { type: 'compete', label: 'Counter Competitor', description: 'A rival is gaining ground. Spend $10K to defend your market position.' },
  optimize: { type: 'optimize', label: 'Optimize Operations', description: 'Cut burn rate by 15% and improve margins. No upfront cost.' },
};

// Apply a decision deterministically and advance the turn
export function applyDecision(state: SimulatorState, type: DecisionType): SimulatorState {
  const industry = INDUSTRIES.find((i) => i.key === state.industry) || INDUSTRIES[0];
  const seed = state.turn + state.companyName.length;
  const rng = seededRandom(seed);
  const rng2 = seededRandom(seed + 7);

  let s: SimulatorState = { ...state, decisions: [...state.decisions] };
  const effect: Record<string, number> = {};
  const decision = DECISIONS[type];

  switch (type) {
    case 'hire': {
      s.cash -= 20000;
      s.employees += 2;
      s.burnRate += 12000;
      s.reputation = Math.min(100, s.reputation + 3);
      effect.cash = -20000; effect.employees = 2; effect.burnRate = 12000; effect.reputation = 3;
      break;
    }
    case 'product_launch': {
      s.cash -= 15000;
      s.productLaunches += 1;
      const baseGrowth = Math.floor(500 * industry.growth * (s.reputation / 50));
      const launchBonus = Math.floor(baseGrowth * (0.5 + rng));
      s.users += Math.max(100, launchBonus);
      s.reputation = Math.min(100, s.reputation + 5);
      effect.cash = -15000; effect.productLaunches = 1;
      break;
    }
    case 'marketing': {
      s.cash -= 25000;
      const marketingGrowth = Math.floor(800 * industry.growth * (0.6 + rng * 0.8));
      s.users += Math.max(200, marketingGrowth);
      s.reputation = Math.min(100, s.reputation + 2);
      effect.cash = -25000;
      break;
    }
    case 'pricing': {
      // Increase revenue per user but slow growth
      const revPerUser = s.users > 0 ? s.revenue / s.users : 0;
      s.revenue = Math.floor(s.revenue * 1.4 + s.users * 2);
      // Growth penalty
      const penalty = Math.floor(s.users * 0.15);
      s.users = Math.max(0, s.users - penalty);
      effect.revenueMultiplier = 1.4;
      break;
    }
    case 'funding_round': {
      // Success depends on traction (users) and reputation
      const tractionScore = Math.min(100, s.users / 100 + s.reputation);
      const successChance = Math.min(0.9, tractionScore / 120);
      if (rng2 < successChance && s.users > 200) {
        const roundSize = Math.floor(500000 + s.users * 100 + s.reputation * 5000);
        const newValuation = Math.floor(roundSize * 5 + s.revenue * 10);
        s.cash += roundSize;
        s.fundingTotal += roundSize;
        s.valuation = Math.max(s.valuation, newValuation);
        // Progress funding stage
        const stages = ['Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D'];
        const currentIdx = stages.indexOf(s.fundingStage);
        s.fundingStage = stages[Math.min(stages.length - 1, currentIdx + 1)];
        effect.funding = roundSize; effect.valuation = newValuation;
      } else {
        effect.funding = 0;
        s.reputation = Math.max(0, s.reputation - 3);
      }
      break;
    }
    case 'compete': {
      s.cash -= 10000;
      // Defend market: retain users, small growth, reputation boost
      const defendGrowth = Math.floor(300 * industry.growth * rng);
      s.users += defendGrowth;
      s.reputation = Math.min(100, s.reputation + 4);
      effect.cash = -10000;
      break;
    }
    case 'optimize': {
      s.burnRate = Math.floor(s.burnRate * 0.85);
      s.reputation = Math.max(0, s.reputation - 1);
      effect.burnRate = -Math.floor(s.burnRate * 0.15);
      break;
    }
  }

  // Competition pressure: each turn competitors steal some users if competition is high
  const competitorImpact = Math.floor(s.users * industry.competition * 0.04 * (0.5 + rng));
  s.users = Math.max(0, s.users - competitorImpact);

  // Revenue from users (deterministic based on users + product launches)
  const revPerUser = 0.5 + s.productLaunches * 0.3;
  s.revenue = Math.floor(s.users * revPerUser);

  // Burn cash
  s.cash -= s.burnRate;

  // Record decision
  s.decisions.push({ turn: s.turn, type, label: decision.label, effect });

  // Advance turn
  s.turn += 1;

  // Record metrics
  s.metricsHistory = [...s.metricsHistory, {
    turn: s.turn - 1,
    users: s.users,
    revenue: s.revenue,
    cash: s.cash,
    valuation: s.valuation,
  }];

  // Check win/loss
  if (s.cash < 0 && s.fundingStage === 'Bootstrapped') {
    s.status = 'failed';
    s.finalScore = calculateScore(s);
  }
  if (s.turn > MAX_TURNS) {
    s.status = s.valuation > 10000000 ? 'won' : 'failed';
    s.finalScore = calculateScore(s);
  }
  // Early win: unicorn
  if (s.valuation >= 1000000000) {
    s.status = 'won';
    s.finalScore = calculateScore(s);
  }

  return s;
}

export function calculateScore(state: SimulatorState): number {
  return Math.floor(
    state.valuation / 10000 +
    state.users * 2 +
    state.revenue / 100 +
    state.reputation * 50 +
    state.productLaunches * 100 +
    (state.status === 'won' ? 5000 : 0)
  );
}

export function getAvailableDecisions(state: SimulatorState): DecisionType[] {
  if (state.status !== 'active') return [];
  const all: DecisionType[] = ['hire', 'product_launch', 'marketing', 'pricing', 'funding_round', 'compete', 'optimize'];
  return all.filter((d) => {
    if (d === 'hire' && state.cash < 20000) return false;
    if (d === 'product_launch' && state.cash < 15000) return false;
    if (d === 'marketing' && state.cash < 25000) return false;
    if (d === 'compete' && state.cash < 10000) return false;
    return true;
  });
}

export function formatMoney(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
