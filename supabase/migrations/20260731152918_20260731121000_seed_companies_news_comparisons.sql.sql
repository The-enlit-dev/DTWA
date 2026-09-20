/*
# Seed AI Company Profiles, News Articles, and Tool Comparisons

1. Data inserted
   - 5 AI company profiles: OpenAI, Anthropic, Google DeepMind, Perplexity, xAI.
     Each includes founders, CEO, founded year, HQ, funding, business model,
     key products, competitors, and latest developments. Uses ON CONFLICT (slug)
     DO UPDATE so re-running refreshes the profile content.
   - 8 sample news_articles spanning categories (Funding, Models, Policy, Product,
     Research) with trending + featured flags set where appropriate.
   - 3 tool_comparisons: ChatGPT vs Claude, Gemini vs ChatGPT, Cursor vs Windsurf,
     each with features, pros/cons, pricing, use cases, and a recommendation.

2. Security
   - No schema or policy changes. Insert-only / upsert seed data.

3. Important Notes
   - Companies are upserted on slug so the migration is idempotent.
   - News + comparisons use ON CONFLICT (slug) DO NOTHING to avoid duplicates.
*/

-- =================== COMPANIES ===================
INSERT INTO companies (slug, name, short_description, description, logo_url, website_url, founders, ceo, founded_year, funding_stage, total_funding, valuation, revenue_estimate, employees_count, headquarters, products, business_model, competitors, latest_developments, tags, is_featured)
VALUES
(
  'openai',
  'OpenAI',
  'Creator of ChatGPT and GPT-4 — the company that brought generative AI to the mainstream.',
  'OpenAI is an AI research and deployment company focused on building artificial general intelligence (AGI) that benefits all of humanity. It is best known for the GPT family of large language models and the ChatGPT assistant, which became the fastest-growing consumer application in history after launching in November 2022.',
  '',
  'https://openai.com',
  ARRAY['Sam Altman', 'Greg Brockman', 'Ilya Sutskever', 'Elon Musk'],
  'Sam Altman',
  2015,
  'Private',
  '$17.9B',
  '$157B',
  '$3.4B (2024 est.)',
  '2,000+',
  'San Francisco, USA',
  ARRAY['ChatGPT', 'GPT-4o', 'DALL·E 3', 'Sora', 'OpenAI API', 'o1 / o3 reasoning models'],
  'Subscriptions (ChatGPT Plus, Team, Enterprise), API usage billing, and a revenue-share agreement with Microsoft for Azure-hosted OpenAI services.',
  ARRAY['Anthropic', 'Google DeepMind', 'Meta AI', 'xAI', 'Mistral'],
  ARRAY['Launched o3 reasoning model family with major coding and math gains', 'Sora video generation moved to general availability', 'Reported $3.4B annualized revenue run-rate', 'Restructured to a Public Benefit Corporation'],
  ARRAY['llm', 'chatgpt', 'agi', 'research'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  founders = EXCLUDED.founders,
  ceo = EXCLUDED.ceo,
  funding_stage = EXCLUDED.funding_stage,
  total_funding = EXCLUDED.total_funding,
  valuation = EXCLUDED.valuation,
  revenue_estimate = EXCLUDED.revenue_estimate,
  employees_count = EXCLUDED.employees_count,
  headquarters = EXCLUDED.headquarters,
  products = EXCLUDED.products,
  business_model = EXCLUDED.business_model,
  competitors = EXCLUDED.competitors,
  latest_developments = EXCLUDED.latest_developments,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO companies (slug, name, short_description, description, logo_url, website_url, founders, ceo, founded_year, funding_stage, total_funding, valuation, revenue_estimate, employees_count, headquarters, products, business_model, competitors, latest_developments, tags, is_featured)
VALUES
(
  'anthropic',
  'Anthropic',
  'AI safety company behind Claude — built for reliability and long-context reasoning.',
  'Anthropic is an AI safety company that builds Claude, a family of large language models designed to be reliable, interpretable, and steerable. Founded by former OpenAI researchers, Anthropic pioneered the Constitutional AI training method and is widely regarded as the leading safety-focused AI lab.',
  '',
  'https://anthropic.com',
  ARRAY['Dario Amodei', 'Daniela Amodei', 'Tom Brown', 'Sam McCandlish'],
  'Dario Amodei',
  2021,
  'Private',
  '$9.7B',
  '$40B',
  '$1B (2024 est.)',
  '1,000+',
  'San Francisco, USA',
  ARRAY['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude API', 'Claude.ai assistant', 'Computer Use'],
  'Subscriptions (Claude Pro, Team, Enterprise), API usage billing, and cloud partnerships with Amazon (Bedrock) and Google Cloud.',
  ARRAY['OpenAI', 'Google DeepMind', 'xAI', 'Mistral'],
  ARRAY['Claude 3.5 Sonnet set state-of-the-art on coding benchmarks', 'Launched Computer Use for agentic desktop tasks', 'Amazon invested an additional $4B', 'Expanded context window to 200K tokens'],
  ARRAY['llm', 'claude', 'safety', 'research'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  founders = EXCLUDED.founders,
  ceo = EXCLUDED.ceo,
  funding_stage = EXCLUDED.funding_stage,
  total_funding = EXCLUDED.total_funding,
  valuation = EXCLUDED.valuation,
  revenue_estimate = EXCLUDED.revenue_estimate,
  employees_count = EXCLUDED.employees_count,
  headquarters = EXCLUDED.headquarters,
  products = EXCLUDED.products,
  business_model = EXCLUDED.business_model,
  competitors = EXCLUDED.competitors,
  latest_developments = EXCLUDED.latest_developments,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO companies (slug, name, short_description, description, logo_url, website_url, founders, ceo, founded_year, funding_stage, total_funding, valuation, revenue_estimate, employees_count, headquarters, products, business_model, competitors, latest_developments, tags, is_featured)
VALUES
(
  'google-deepmind',
  'Google DeepMind',
  'Google''s unified AI lab — creators of Gemini, AlphaFold, and AlphaGo.',
  'Google DeepMind is Google''s premier AI research lab, formed in 2023 by merging DeepMind and Google Brain. It pioneered reinforcement learning with AlphaGo and AlphaZero, solved protein folding with AlphaFold, and now develops the Gemini multimodal model family that powers AI features across Google products.',
  '',
  'https://deepmind.google',
  ARRAY['Demis Hassabis', 'Shane Legg', 'Mustafa Suleyman'],
  'Demis Hassabis',
  2010,
  'Subsidiary',
  'Acquired by Google (2014, $500M)',
  'Part of Alphabet',
  'Integrated with Google Cloud AI',
  '2,700+',
  'London, UK',
  ARRAY['Gemini 2.0', 'AlphaFold 3', 'Gemini API', 'Project Astra', 'NotebookLM', 'Veo'],
  'Integrated into Alphabet revenue via Google Cloud (Vertex AI), Google Workspace AI add-ons, advertising, and Gemini consumer subscriptions.',
  ARRAY['OpenAI', 'Anthropic', 'xAI', 'Meta AI'],
  ARRAY['Gemini 2.0 Flash delivered low-latency multimodal reasoning', 'AlphaFold 3 expanded to DNA, RNA, and ligands', 'Project Astra demonstrated real-time multimodal assistants', 'NotebookLM Audio Overviews went viral'],
  ARRAY['llm', 'gemini', 'research', 'multimodal'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  founders = EXCLUDED.founders,
  ceo = EXCLUDED.ceo,
  funding_stage = EXCLUDED.funding_stage,
  total_funding = EXCLUDED.total_funding,
  valuation = EXCLUDED.valuation,
  revenue_estimate = EXCLUDED.revenue_estimate,
  employees_count = EXCLUDED.employees_count,
  headquarters = EXCLUDED.headquarters,
  products = EXCLUDED.products,
  business_model = EXCLUDED.business_model,
  competitors = EXCLUDED.competitors,
  latest_developments = EXCLUDED.latest_developments,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO companies (slug, name, short_description, description, logo_url, website_url, founders, ceo, founded_year, funding_stage, total_funding, valuation, revenue_estimate, employees_count, headquarters, products, business_model, competitors, latest_developments, tags, is_featured)
VALUES
(
  'perplexity',
  'Perplexity AI',
  'Answer engine that combines live web search with LLMs — cited, conversational, and fast.',
  'Perplexity is an AI-powered answer engine that combines real-time web search with large language models to deliver cited, conversational answers. Rather than returning a list of links, it reads sources and synthesizes a response with inline citations, making it a leading challenger to traditional search engines.',
  '',
  'https://perplexity.ai',
  ARRAY['Aravind Srinivas', 'Denis Yarats', 'Johnny Ho'],
  'Aravind Srinivas',
  2022,
  'Series B',
  '$500M',
  '$9B',
  '$80M (2024 est.)',
  '150+',
  'San Francisco, USA',
  ARRAY['Perplexity Search', 'Perplexity Pro', 'Perplexity Spaces', 'Perplexity Labs', 'Comet browser'],
  'Subscriptions (Perplexity Pro), enterprise API, and revenue share with publishers through the Perplexity Publishers Program.',
  ARRAY['OpenAI', 'Google', 'xAI', 'You.com'],
  ARRAY['Raised $500M Series B at a $9B valuation', 'Launched Comet, an agentic web browser', 'Rolled out Perplexity Labs for multi-step research', 'Expanded publisher revenue-share partnerships'],
  ARRAY['search', 'answer-engine', 'llm', 'research'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  founders = EXCLUDED.founders,
  ceo = EXCLUDED.ceo,
  funding_stage = EXCLUDED.funding_stage,
  total_funding = EXCLUDED.total_funding,
  valuation = EXCLUDED.valuation,
  revenue_estimate = EXCLUDED.revenue_estimate,
  employees_count = EXCLUDED.employees_count,
  headquarters = EXCLUDED.headquarters,
  products = EXCLUDED.products,
  business_model = EXCLUDED.business_model,
  competitors = EXCLUDED.competitors,
  latest_developments = EXCLUDED.latest_developments,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO companies (slug, name, short_description, description, logo_url, website_url, founders, ceo, founded_year, funding_stage, total_funding, valuation, revenue_estimate, employees_count, headquarters, products, business_model, competitors, latest_developments, tags, is_featured)
VALUES
(
  'xai',
  'xAI',
  'Elon Musk''s AI lab building Grok — the real-time, irreverent assistant for X.',
  'xAI is an artificial intelligence company founded by Elon Musk to build advanced AI systems with a focus on truth-seeking and real-time information. Its flagship product, Grok, is integrated into the X (formerly Twitter) platform and is designed to answer spicy questions that other models might refuse.',
  '',
  'https://x.ai',
  ARRAY['Elon Musk', 'Igor Babuschkin', 'Greg Yang', 'Manuel Kreiss'],
  'Elon Musk',
  2023,
  'Series C',
  '$12B',
  '$50B',
  'Early-stage revenue via X subscriptions',
  '300+',
  'San Francisco Bay Area, USA',
  ARRAY['Grok 3', 'Grok 2', 'Grok API', 'Colossus supercomputer'],
  'Revenue from X Premium / Premium+ subscriptions that include Grok, plus enterprise API access and a standalone Grok subscription.',
  ARRAY['OpenAI', 'Google DeepMind', 'Anthropic', 'Meta AI'],
  ARRAY['Trained Grok 3 on the Colossus 100k-GPU cluster', 'Launched Grok with image generation via FLUX', 'Raised $6B Series C at a $24B valuation, later $50B', 'Open-sourced Grok-1 model weights'],
  ARRAY['llm', 'grok', 'real-time', 'research'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url,
  founders = EXCLUDED.founders,
  ceo = EXCLUDED.ceo,
  funding_stage = EXCLUDED.funding_stage,
  total_funding = EXCLUDED.total_funding,
  valuation = EXCLUDED.valuation,
  revenue_estimate = EXCLUDED.revenue_estimate,
  employees_count = EXCLUDED.employees_count,
  headquarters = EXCLUDED.headquarters,
  products = EXCLUDED.products,
  business_model = EXCLUDED.business_model,
  competitors = EXCLUDED.competitors,
  latest_developments = EXCLUDED.latest_developments,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();


-- =================== NEWS ARTICLES ===================
INSERT INTO news_articles (slug, title, summary, category, image_url, source_name, source_url, is_trending, is_featured, published_at, tags)
VALUES
(
  'openai-restructures-public-benefit-corporation',
  'OpenAI Restructures as a Public Benefit Corporation',
  'OpenAI completed its long-planned corporate restructuring, converting from a capped-profit entity to a Delaware Public Benefit Corporation as it finalizes a massive funding round.',
  'Business',
  'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  true,
  true,
  now() - interval '1 day',
  ARRAY['openai', 'funding', 'governance']
),
(
  'anthropic-claude-35-sonnet-coding-benchmark',
  'Claude 3.5 Sonnet Sets New Coding Benchmark Record',
  'Anthropic''s Claude 3.5 Sonnet surpassed GPT-4o on the SWE-bench coding benchmark, cementing its position as the top model for software development tasks.',
  'Models',
  'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  true,
  false,
  now() - interval '2 days',
  ARRAY['anthropic', 'claude', 'coding']
),
(
  'google-gemini-2-flash-multimodal',
  'Google Ships Gemini 2.0 Flash With Low-Latency Multimodal Reasoning',
  'Google DeepMind released Gemini 2.0 Flash, a low-latency multimodal model powering Project Astra and the next generation of real-time AI assistants.',
  'Product',
  'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  true,
  false,
  now() - interval '3 days',
  ARRAY['google', 'gemini', 'multimodal']
),
(
  'perplexity-raises-500m-series-b',
  'Perplexity Closes $500M Series B at $9B Valuation',
  'The AI answer engine startup Perplexity raised $500M in Series B funding, tripling its valuation in under a year as it challenges traditional search.',
  'Funding',
  'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  false,
  false,
  now() - interval '4 days',
  ARRAY['perplexity', 'funding', 'search']
),
(
  'xai-grok-3-colossus-cluster',
  'xAI Trains Grok 3 on the Colossus 100,000-GPU Cluster',
  'Elon Musk''s xAI powered up Colossus, a 100,000-GPU supercomputer in Memphis, and used it to train Grok 3 — claiming frontier-level reasoning performance.',
  'Research',
  'https://images.pexels.com/photos/8438922/pexels-photo-8438922.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  false,
  true,
  now() - interval '5 days',
  ARRAY['xai', 'grok', 'compute']
),
(
  'eu-ai-act-enforcement-begins',
  'EU AI Act Enforcement Begins With Tiered Compliance Deadlines',
  'The European Union''s AI Act entered its enforcement phase, introducing risk-based obligations and bans on certain uses of AI with staggered deadlines through 2026.',
  'Policy',
  'https://images.pexels.com/photos/5439381/pexels-photo-5439381.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  false,
  false,
  now() - interval '6 days',
  ARRAY['policy', 'eu', 'regulation']
),
(
  'openai-sora-general-availability',
  'OpenAI Launches Sora Video Generation to All Users',
  'After months of limited preview, OpenAI made Sora — its text-to-video model — generally available inside ChatGPT Plus and Pro subscriptions.',
  'Product',
  'https://images.pexels.com/photos/2883134/pexels-photo-2883134.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  false,
  false,
  now() - interval '7 days',
  ARRAY['openai', 'sora', 'video']
),
(
  'anthropic-computer-use-agents',
  'Anthropic Unveils Computer Use for Agentic Desktop Tasks',
  'Anthropic introduced Computer Use, a capability that lets Claude view screens, move cursors, and complete multi-step tasks inside desktop applications.',
  'Product',
  'https://images.pexels.com/photos/7777072/pexels-photo-7777072.jpeg?w=800',
  'Decoding Tomorrow',
  'https://decodingtomorrow.in/blog',
  false,
  false,
  now() - interval '9 days',
  ARRAY['anthropic', 'agents', 'automation']
)
ON CONFLICT (slug) DO NOTHING;


-- =================== TOOL COMPARISONS ===================
INSERT INTO tool_comparisons (slug, title, summary, tool_a, tool_b, tool_a_slug, tool_b_slug, features, pros_cons, pricing, use_cases, recommendation, winner, category, tags, published_at)
VALUES
(
  'chatgpt-vs-claude',
  'ChatGPT vs Claude: Which AI Assistant Is Better in 2025?',
  'OpenAI''s ChatGPT and Anthropic''s Claude are the two most popular AI assistants. We compare them on reasoning, coding, writing, pricing, and ecosystem to help you pick the right one.',
  'ChatGPT',
  'Claude',
  'chatgpt',
  'claude',
  '[
    {"feature":"Maker","tool_a_value":"OpenAI","tool_b_value":"Anthropic"},
    {"feature":"Flagship model","tool_a_value":"GPT-4o / o3","tool_b_value":"Claude 3.5 Sonnet"},
    {"feature":"Context window","tool_a_value":"128K tokens","tool_b_value":"200K tokens"},
    {"feature":"Multimodal","tool_a_value":"Image, voice, video","tool_b_value":"Image, documents"},
    {"feature":"Web search","tool_a_value":"Yes (built-in)","tool_b_value":"Yes (built-in)"},
    {"feature":"Coding (SWE-bench)","tool_a_value":"Strong","tool_b_value":"Best-in-class"},
    {"feature":"Creative writing","tool_a_value":"Very good","tool_b_value":"Excellent"},
    {"feature":"Voice mode","tool_a_value":"Advanced real-time","tool_b_value":"Limited"},
    {"feature":"API ecosystem","tool_a_value":"Largest","tool_b_value":"Growing fast"},
    {"feature":"Ecosystem integrations","tool_a_value":"Microsoft, Apple, G Suite","tool_b_value":"Amazon, Google Cloud, Notion"}
  ]'::jsonb,
  '{"tool_a":{"pros":["Largest third-party plugin and API ecosystem","Advanced real-time voice mode","Tight Microsoft Copilot integration","Massive knowledge base and tool library"],"cons":["Can be verbose and less precise on long documents","Higher API cost at top tier","Occasional refusals on nuanced topics"]},"tool_b":{"pros":["Best-in-class coding and reasoning","200K token context handles huge documents","More natural, nuanced writing voice","Strong safety and reliability record"],"cons":["Smaller plugin ecosystem","No real-time voice mode","Lower brand recognition"]}}'::jsonb,
  '{"tool_a":{"plan":"ChatGPT Plus","price":"$20/mo","details":"GPT-4o, DALL-E, voice, plus higher limits"},"tool_b":{"plan":"Claude Pro","price":"$20/mo","details":"Claude 3.5 Sonnet, 200K context, priority access"}}'::jsonb,
  '{"tool_a":["Everyday chat and quick tasks","Voice conversations","Teams embedded in Microsoft 365","App builders using the API"],"tool_b":["Software engineering and code review","Long-document analysis (legal, research)","Nuanced content and copywriting","Safety-critical or regulated workflows"]}'::jsonb,
  'If your work is coding, long-document analysis, or careful writing, Claude is the sharper tool. For everything else — voice, multimodal, a huge app ecosystem, and the widest integration support — ChatGPT is the more versatile all-rounder. For most general users, ChatGPT is the safer default; developers and writers should try Claude first.',
  'tie',
  'AI Assistants',
  ARRAY['chatgpt', 'claude', 'comparison', 'ai-assistants'],
  now() - interval '2 days'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tool_comparisons (slug, title, summary, tool_a, tool_b, tool_a_slug, tool_b_slug, features, pros_cons, pricing, use_cases, recommendation, winner, category, tags, published_at)
VALUES
(
  'gemini-vs-chatgpt',
  'Gemini vs ChatGPT: Google''s Challenger vs the Incumbent',
  'Google''s Gemini and OpenAI''s ChatGPT are locked in a head-to-head battle for the multimodal AI crown. We compare reasoning, ecosystem, multimodal, and value to find the winner.',
  'Gemini',
  'ChatGPT',
  'gemini',
  'chatgpt',
  '[
    {"feature":"Maker","tool_a_value":"Google DeepMind","tool_b_value":"OpenAI"},
    {"feature":"Flagship model","tool_a_value":"Gemini 2.0 Flash / Pro","tool_b_value":"GPT-4o / o3"},
    {"feature":"Context window","tool_a_value":"1M tokens","tool_b_value":"128K tokens"},
    {"feature":"Multimodal","tool_a_value":"Image, audio, video","tool_b_value":"Image, voice, video"},
    {"feature":"Native Google integration","tool_a_value":"Workspace, Search, Android","tool_b_value":"None"},
    {"feature":"Web search","tool_a_value":"Native Google Search","tool_b_value":"Built-in search"},
    {"feature":"Coding","tool_a_value":"Good","tool_b_value":"Strong"},
    {"feature":"Free tier","tool_a_value":"Generous","tool_b_value":"Limited"},
    {"feature":"API ecosystem","tool_a_value":"Vertex AI","tool_b_value":"Largest overall"},
    {"feature":"Mobile app","tool_a_value":"Yes (Gemini)","tool_b_value":"Yes (ChatGPT)"}
  ]'::jsonb,
  '{"tool_a":{"pros":["1M-token context window — the largest available","Deep Google Workspace + Search integration","Excellent multimodal and video understanding","Generous free tier"],"cons":["Writing style can feel more generic","Smaller plugin ecosystem","Occasional accuracy issues on facts"]},"tool_b":{"pros":["Largest plugin and integration ecosystem","Superior creative writing and coding","Advanced real-time voice mode","Strongest brand and community"],"cons":["Shorter 128K context window","Free tier is more limited","Higher API pricing at top tier"]}}'::jsonb,
  '{"tool_a":{"plan":"Gemini Advanced","price":"$19.99/mo","details":"Included with Google One AI Premium, 2TB storage"},"tool_b":{"plan":"ChatGPT Plus","price":"$20/mo","details":"GPT-4o, DALL-E, voice, higher limits"}}'::jsonb,
  '{"tool_a":["Anyone living in Google Workspace","Long-context tasks (books, codebases)","Budget-conscious users (great free tier)","Android and Pixel users"],"tool_b":["Developers and coders","Creative writers and content teams","Power users who want plugins","Teams embedded in Microsoft 365"]}'::jsonb,
  'Gemini wins on context size, Google integration, and value — especially for anyone already in Google Workspace. ChatGPT wins on ecosystem breadth, coding, and writing quality. If you live in Google, pick Gemini; if you want the richest app ecosystem and best raw output quality, pick ChatGPT.',
  'tie',
  'AI Assistants',
  ARRAY['gemini', 'chatgpt', 'comparison', 'multimodal'],
  now() - interval '4 days'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tool_comparisons (slug, title, summary, tool_a, tool_b, tool_a_slug, tool_b_slug, features, pros_cons, pricing, use_cases, recommendation, winner, category, tags, published_at)
VALUES
(
  'cursor-vs-windsurf',
  'Cursor vs Windsurf: The Best AI Code Editor in 2025',
  'Cursor and Windsurf are the two leading AI-native code editors built on VS Code. We compare autocomplete, agent mode, context handling, and pricing for developers.',
  'Cursor',
  'Windsurf',
  'cursor',
  'windsurf',
  '[
    {"feature":"Maker","tool_a_value":"Anysphere","tool_b_value":"Codeium"},
    {"feature":"Base editor","tool_a_value":"VS Code fork","tool_b_value":"VS Code fork"},
    {"feature":"Autocomplete","tool_a_value":"Cursor Tab (multi-line)","tool_b_value":"Cascade (multi-line)"},
    {"feature":"Agent / chat","tool_a_value":"Composer + Agent","tool_b_value":"Cascade Agent"},
    {"feature":"Whole-codebase context","tool_a_value":"Excellent indexing","tool_b_value":"Excellent indexing"},
    {"feature":"Model choice","tool_a_value":"GPT-4o, Claude, o3","tool_b_value":"GPT-4o, Claude, o3"},
    {"feature":"Terminal control","tool_a_value":"Yes (agent)","tool_b_value":"Yes (agent)"},
    {"feature":"Free tier","tool_a_value":"2,000 completions/mo","tool_b_value":"Generous unlimited preview"},
    {"feature":"Enterprise","tool_a_value":"Yes (privacy mode)","tool_b_value":"Yes"},
    {"feature":"Maturity","tool_a_value":"More established","tool_b_value":"Newer, moving fast"}
  ]'::jsonb,
  '{"tool_a":{"pros":["Most mature AI editor with large community","Excellent Composer + Agent workflow","Privacy mode for enterprise","Strong multi-file edits"],"cons":["Free tier runs out fast","Can feel heavy on large repos","Pro plan adds up for heavy users"]},"tool_b":{"pros":["Generous free tier","Cascade agent is very capable","Strong multi-file refactoring","Backed by Codeium''s model stack"],"cons":["Newer, smaller community","Some features still maturing","Less enterprise track record"]}}'::jsonb,
  '{"tool_a":{"plan":"Cursor Pro","price":"$20/mo","details":"Unlimited completions, 500 fast agent requests"},"tool_b":{"plan":"Windsurf Pro","price":"$15/mo","details":"Unlimited completions, generous agent usage"}}'::jsonb,
  '{"tool_a":["Established teams that want a mature tool","Enterprise users needing privacy mode","Power users on the Composer workflow"],"tool_b":["Budget-conscious individual developers","Teams wanting a generous free tier","Anyone wanting the newest agent features"]}'::jsonb,
  'Cursor is the safer pick for established teams and enterprise users — it is more mature, has privacy mode, and a larger community. Windsurf is the value pick: it is cheaper, has a more generous free tier, and its Cascade agent is genuinely impressive. If budget matters, start with Windsurf; if you want polish and proven workflows, go Cursor.',
  'tool_a',
  'Developer Tools',
  ARRAY['cursor', 'windsurf', 'code-editor', 'developer-tools'],
  now() - interval '6 days'
)
ON CONFLICT (slug) DO NOTHING;
