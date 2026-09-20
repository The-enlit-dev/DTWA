export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  role: 'user' | 'editor' | 'admin' | 'super_admin';
  force_password_change: boolean;
  website: string;
  twitter: string;
  created_at: string;
  updated_at: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  reputation: number;
  title: string;
  github: string;
  linkedin: string;
  is_public: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  article_count: number;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  author_id: string;
  category_id: string;
  status: 'draft' | 'published' | 'archived' | 'pending_review';
  view_count: number;
  like_count: number;
  comment_count: number;
  read_time: number;
  tags: string[];
  // SEO fields
  seo_title: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  canonical_url: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
  categories?: Category;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  simple_explanation: string;
  detailed_explanation: string;
  example: string | null;
  category: string;
  tags: string[];
  related_term_slugs: string[];
  faq: Array<{ question: string; answer: string }>;
  // SEO
  seo_title: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  og_image: string;
  canonical_url: string;
  // Status
  status: 'draft' | 'published';
  view_count: number;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  youtube_id: string;
  description: string;
  category: string;
  thumbnail_url: string;
  view_count: number;
  duration: string;
  is_featured: boolean;
  published_at: string;
  created_at: string;
}

export interface AiTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  website_url: string;
  logo_url: string;
  rating: number;
  pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | 'enterprise';
  pros: string[];
  cons: string[];
  tags: string[];
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  logo_url: string;
  website_url: string;
  founders: string[];
  ceo: string;
  founded_year: number;
  funding_stage: string;
  total_funding: string;
  revenue_estimate: string;
  valuation: string;
  employees_count: string;
  headquarters: string;
  products: string[];
  business_model: string;
  competitors: string[];
  latest_developments: string[];
  tags: string[];
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  image_url: string;
  source_name: string;
  source_url: string;
  author: string;
  is_trending: boolean;
  is_featured: boolean;
  published_at: string;
  view_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ComparisonFeature {
  feature: string;
  tool_a_value: string;
  tool_b_value: string;
}

export interface ComparisonProsCons {
  pros: string[];
  cons: string[];
}

export interface ComparisonPricing {
  plan: string;
  price: string;
  details: string;
}

export interface ToolComparison {
  id: string;
  title: string;
  slug: string;
  summary: string;
  tool_a: string;
  tool_b: string;
  tool_a_slug: string;
  tool_b_slug: string;
  features: ComparisonFeature[];
  pros_cons: {
    tool_a: ComparisonProsCons;
    tool_b: ComparisonProsCons;
  };
  pricing: {
    tool_a: ComparisonPricing;
    tool_b: ComparisonPricing;
  };
  use_cases: {
    tool_a: string[];
    tool_b: string[];
  };
  recommendation: string;
  winner: 'tool_a' | 'tool_b' | 'tie';
  category: string;
  tags: string[];
  view_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_approved: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  replies?: Comment[];
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string;
  is_confirmed: boolean;
  subscribed_at: string;
}

// ============ INTERACTIVE PLATFORM TYPES ============

export interface GameSave {
  id: string;
  user_id: string;
  company_name: string;
  logo_emoji: string;
  industry: string;
  turn: number;
  cash: number;
  users: number;
  revenue: number;
  employees: number;
  burn_rate: number;
  reputation: number;
  product_launches: number;
  funding_stage: string;
  funding_total: number;
  valuation: number;
  decisions: any[];
  metrics_history: any[];
  status: 'active' | 'won' | 'failed' | 'abandoned';
  final_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  company_name: string;
  industry: string;
  final_score: number;
  valuation: number;
  funding_stage: string;
  status: string;
  updated_at: string;
  username: string;
  avatar_url: string;
}

export interface Prediction {
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
  created_by: string | null;
  vote_count: number;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
}

export interface PredictionVote {
  id: string;
  prediction_id: string;
  user_id: string;
  vote_value: string;
  comment: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  website_url: string;
  github_url: string;
  screenshots: string[];
  tags: string[];
  creator_id: string;
  upvote_count: number;
  comment_count: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface SkillNode {
  id: string;
  category: string;
  node_key: string;
  title: string;
  description: string;
  xp_reward: number;
  difficulty: 1 | 2 | 3;
  prerequisites: string[];
  resource_url: string;
  order: number;
  created_at: string;
}

export interface UserSkillProgress {
  id: string;
  user_id: string;
  node_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface SkillQuizQuestion {
  id: string;
  node_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Badge {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  xp_reward: number;
  requirement: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  prompt: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  starts_at: string;
  ends_at: string | null;
  status: 'upcoming' | 'active' | 'voting' | 'closed';
  submission_count: number;
  created_at: string;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  title: string;
  description: string;
  link_url: string;
  image_url: string;
  vote_count: number;
  is_winner: boolean;
  rank: number | null;
  created_at: string;
}

export interface BusinessIdea {
  id: string;
  title: string;
  slug: string;
  pitch: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  market_size: string;
  monetization: string;
  tech_stack: string[];
  tags: string[];
  rating_sum: number;
  rating_count: number;
  bookmark_count: number;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  link_url: string;
  metadata: any;
  xp_earned: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
}
