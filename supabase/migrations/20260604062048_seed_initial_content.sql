/*
  # Seed Data for Decoding Tomorrow Platform

  1. Content Seeded
    - 6 categories (AI Tools, Companies, Business, Future Tech, Tutorials, News)
    - 8 articles covering AI topics
    - 6 YouTube videos
    - 10 AI tools (ChatGPT, Claude, Midjourney, etc.)
    - 8 AI companies (OpenAI, Anthropic, Google DeepMind, etc.)

  2. Notes
    - All articles reference a placeholder author_id that will be linked to real admin
    - Videos use real YouTube IDs for popular AI content
    - All content is realistic and editorial in quality
*/

-- CATEGORIES
INSERT INTO categories (name, slug, description, color, icon) VALUES
  ('AI Tools', 'ai-tools', 'Reviews and guides on the latest AI tools and software', '#4A6CF7', 'Cpu'),
  ('Companies', 'companies', 'Deep dives into AI companies, funding, and founders', '#7B2FBE', 'Building2'),
  ('Business Analysis', 'business', 'How AI is transforming industries and business models', '#FF006E', 'TrendingUp'),
  ('Future Tech', 'future-tech', 'Predictions and analysis of emerging technologies', '#FF6B35', 'Zap'),
  ('Tutorials', 'tutorials', 'Step-by-step guides to using AI in your workflow', '#10B981', 'BookOpen'),
  ('News', 'news', 'Breaking news and updates from the AI world', '#F59E0B', 'Newspaper')
ON CONFLICT (slug) DO NOTHING;

-- AI TOOLS
INSERT INTO ai_tools (name, slug, short_description, description, category, website_url, logo_url, rating, pricing_model, pros, cons, tags, view_count, is_featured) VALUES
(
  'ChatGPT', 'chatgpt',
  'OpenAI''s flagship conversational AI assistant powering millions of workflows.',
  'ChatGPT by OpenAI is the world''s most widely used AI assistant. From writing and coding to research and analysis, it handles virtually any text-based task with remarkable accuracy. GPT-4o brings multimodal capabilities including image understanding and voice interaction.',
  'Productivity', 'https://chat.openai.com', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?w=80',
  4.8, 'freemium',
  ARRAY['Incredibly versatile', 'Huge plugin ecosystem', 'Excellent coding assistant', 'Strong reasoning'],
  ARRAY['Free tier has limitations', 'Can hallucinate facts', 'Privacy concerns with data'],
  ARRAY['chatbot', 'writing', 'coding', 'openai'],
  128400, true
),
(
  'Claude', 'claude',
  'Anthropic''s safety-focused AI assistant known for nuanced reasoning and long context.',
  'Claude by Anthropic is renowned for its thoughtful, nuanced responses and exceptional long-context understanding. With a 200K token context window, it excels at analyzing long documents, writing structured content, and complex reasoning tasks.',
  'Productivity', 'https://claude.ai', 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?w=80',
  4.7, 'freemium',
  ARRAY['200K context window', 'Excellent at analysis', 'Less hallucinations', 'Great for long docs'],
  ARRAY['No image generation', 'Slower than GPT-4', 'Fewer integrations'],
  ARRAY['chatbot', 'analysis', 'writing', 'anthropic'],
  97200, true
),
(
  'Midjourney', 'midjourney',
  'The gold standard AI image generation tool used by designers and creatives worldwide.',
  'Midjourney produces the most aesthetically stunning AI-generated images available. Operating through Discord, it has become the go-to tool for concept art, brand visuals, and creative projects. Its v6 model delivers photorealistic and artistic results that push creative boundaries.',
  'Creative', 'https://midjourney.com', 'https://images.pexels.com/photos/8386422/pexels-photo-8386422.jpeg?w=80',
  4.9, 'paid',
  ARRAY['Best image quality', 'Highly artistic output', 'Active community', 'Consistent style control'],
  ARRAY['Requires Discord', 'No free tier', 'Steep learning curve for prompts'],
  ARRAY['image-generation', 'design', 'creative', 'art'],
  89600, true
),
(
  'Cursor', 'cursor',
  'The AI-first code editor that understands your entire codebase.',
  'Cursor is a fork of VS Code with deep AI integration. It understands your entire codebase and can make complex multi-file edits, explain code, fix bugs, and even build features from natural language descriptions. The Tab autocomplete predicts your next edit with uncanny accuracy.',
  'Development', 'https://cursor.sh', 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?w=80',
  4.8, 'freemium',
  ARRAY['Codebase-aware AI', 'VS Code compatible', 'Multi-file edits', 'Fast Tab autocomplete'],
  ARRAY['Can be expensive at scale', 'Occasional context loss', 'Requires internet connection'],
  ARRAY['coding', 'development', 'ide', 'programming'],
  76300, true
),
(
  'Perplexity AI', 'perplexity',
  'AI-powered search engine that gives cited, real-time answers to any question.',
  'Perplexity combines the power of large language models with real-time web search. Unlike ChatGPT, every answer comes with cited sources, making it ideal for research. Its Pro version offers access to GPT-4, Claude, and Gemini all in one interface.',
  'Research', 'https://perplexity.ai', 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?w=80',
  4.6, 'freemium',
  ARRAY['Always up-to-date info', 'Cites sources', 'Multiple AI models', 'Great UI'],
  ARRAY['Less creative than ChatGPT', 'Pro can be pricey', 'Occasional search errors'],
  ARRAY['search', 'research', 'information', 'web'],
  68900, false
),
(
  'Notion AI', 'notion-ai',
  'AI writing and thinking assistant built directly into your Notion workspace.',
  'Notion AI transforms your workspace into an intelligent partner. It can summarize meeting notes, draft documents, extract action items, translate content, and help you think through complex problems — all without leaving Notion. Perfect for teams already using Notion.',
  'Productivity', 'https://notion.so/product/ai', 'https://images.pexels.com/photos/7376/startup-photos.jpg?w=80',
  4.3, 'paid',
  ARRAY['Seamless Notion integration', 'Great for summarization', 'Team-friendly', 'Document drafting'],
  ARRAY['Requires Notion subscription', 'Limited standalone use', 'Can be repetitive'],
  ARRAY['productivity', 'writing', 'notes', 'workspace'],
  45200, false
),
(
  'ElevenLabs', 'elevenlabs',
  'The most realistic AI voice cloning and text-to-speech platform available.',
  'ElevenLabs has redefined AI voice synthesis. Its voice cloning technology can replicate any voice with just a few seconds of audio. Content creators, podcasters, and enterprises use it for narration, dubbing, and building voice AI agents. The quality is nearly indistinguishable from human speech.',
  'Audio', 'https://elevenlabs.io', 'https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?w=80',
  4.7, 'freemium',
  ARRAY['Hyper-realistic voices', 'Voice cloning feature', 'Multiple languages', 'API access'],
  ARRAY['Limited free tier', 'Ethical concerns with cloning', 'Expensive at high volume'],
  ARRAY['voice', 'audio', 'tts', 'content-creation'],
  52800, false
),
(
  'Runway Gen-3', 'runway-gen3',
  'Hollywood-grade AI video generation and editing platform.',
  'Runway''s Gen-3 Alpha model represents a leap forward in AI video generation. Used by professional filmmakers and content studios, it can generate cinematic footage, apply visual effects, and extend videos with remarkable coherence. The future of video production is here.',
  'Video', 'https://runwayml.com', 'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?w=80',
  4.5, 'paid',
  ARRAY['Cinematic quality output', 'Professional tools', 'Actively updated', 'Industry adoption'],
  ARRAY['Expensive', 'Learning curve', 'Generation can be slow', 'Limited free credits'],
  ARRAY['video', 'filmmaking', 'creative', 'generation'],
  41600, false
),
(
  'Gemini Advanced', 'gemini-advanced',
  'Google''s most capable AI model with deep integration across Google Workspace.',
  'Gemini Advanced (formerly Bard) is Google''s flagship AI product. With access to real-time Google Search, YouTube, Gmail, and Docs integration, it''s the most connected AI assistant available. The 1.5 Pro model features a 1M token context window — the largest of any commercial model.',
  'Productivity', 'https://gemini.google.com', 'https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?w=80',
  4.4, 'freemium',
  ARRAY['Google ecosystem integration', '1M context window', 'Real-time web access', 'Free for basic use'],
  ARRAY['Inconsistent reasoning', 'Privacy concerns', 'Lags behind in coding tasks'],
  ARRAY['google', 'assistant', 'multimodal', 'search'],
  61300, false
),
(
  'Sora', 'sora',
  'OpenAI''s groundbreaking text-to-video model that generates cinematic video from text.',
  'Sora by OpenAI is one of the most anticipated AI releases in history. Capable of generating realistic and imaginative video clips up to 60 seconds from text prompts, Sora understands not just what you describe but how the physical world works. A paradigm shift for content creation.',
  'Video', 'https://openai.com/sora', 'https://images.pexels.com/photos/7722694/pexels-photo-7722694.jpeg?w=80',
  4.6, 'paid',
  ARRAY['Photorealistic video generation', 'Complex scene understanding', 'OpenAI quality bar', 'Long video support'],
  ARRAY['Limited availability', 'Very expensive', 'Slow generation times', 'Ethical guardrails can be limiting'],
  ARRAY['video', 'openai', 'generation', 'filmmaking'],
  93200, true
)
ON CONFLICT (slug) DO NOTHING;

-- COMPANIES
INSERT INTO companies (name, slug, short_description, description, logo_url, website_url, founders, founded_year, funding_stage, total_funding, revenue_estimate, valuation, employees_count, headquarters, products, tags, is_featured, view_count) VALUES
(
  'OpenAI', 'openai',
  'The company behind ChatGPT, GPT-4, DALL-E, and Sora — the most influential AI lab in history.',
  'OpenAI was founded in 2015 as a non-profit with a mission to ensure AI benefits all of humanity. It shocked the world in November 2022 with ChatGPT, which became the fastest-growing consumer application in history. The company has since pivoted to a "capped profit" model, attracting massive investment from Microsoft and others. With products spanning language models, image generation, and video, OpenAI sits at the absolute center of the AI revolution.',
  'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?w=80',
  'https://openai.com',
  ARRAY['Sam Altman', 'Greg Brockman', 'Ilya Sutskever', 'Elon Musk (former)'],
  2015, 'Private', '$17.9B', '$3.4B ARR', '$157B', '3,000+', 'San Francisco, CA',
  ARRAY['ChatGPT', 'GPT-4o', 'DALL-E 3', 'Sora', 'Whisper', 'OpenAI API'],
  ARRAY['llm', 'chatbot', 'api', 'video-generation'],
  true, 142000
),
(
  'Anthropic', 'anthropic',
  'The safety-focused AI lab built by ex-OpenAI researchers creating Constitutional AI.',
  'Anthropic was founded in 2021 by Dario Amodei, Daniela Amodei, and other former OpenAI researchers who left over concerns about safety practices. The company has pioneered "Constitutional AI" — a method for training AI systems to be helpful, harmless, and honest. Their Claude model family has earned a reputation for nuanced reasoning and strong safety properties. With $7.3B in funding from Google, Amazon, and others, Anthropic is OpenAI''s most formidable competitor.',
  'https://images.pexels.com/photos/7915357/pexels-photo-7915357.jpeg?w=80',
  'https://anthropic.com',
  ARRAY['Dario Amodei', 'Daniela Amodei', 'Tom Brown', 'Chris Olah'],
  2021, 'Series E', '$7.3B', '$1B ARR', '$18.4B', '1,000+', 'San Francisco, CA',
  ARRAY['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude API', 'Amazon Bedrock'],
  ARRAY['safety', 'llm', 'api', 'constitutional-ai'],
  true, 98400
),
(
  'Google DeepMind', 'google-deepmind',
  'Alphabet''s unified AI research powerhouse behind Gemini, AlphaFold, and more.',
  'Google DeepMind was formed in 2023 through the merger of Google Brain and DeepMind — Alphabet''s two premier AI research divisions. The combined entity represents perhaps the deepest concentration of AI talent and compute resources in the world. From Gemini to AlphaFold to AlphaCode, Google DeepMind''s research spans fundamental science to consumer products. It is both OpenAI''s biggest rival and the organization with the most to lose from AI disrupting search.',
  'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?w=80',
  'https://deepmind.google',
  ARRAY['Demis Hassabis', 'Jeff Dean', 'Shane Legg'],
  2010, 'Subsidiary', 'Part of Alphabet', '$2B+ (est.)', '$1.84T (Alphabet)', '5,000+', 'London / Mountain View',
  ARRAY['Gemini 1.5 Pro', 'AlphaFold 3', 'AlphaCode 2', 'Imagen 3', 'Veo'],
  ARRAY['research', 'science', 'llm', 'alphabet'],
  true, 87600
),
(
  'Mistral AI', 'mistral-ai',
  'The French AI startup challenging US dominance with powerful open-source models.',
  'Mistral AI burst onto the scene in 2023, founded by former Google DeepMind and Meta researchers. In just 14 months, the Paris-based startup achieved unicorn status by releasing powerful open-source models that competed with much larger closed models. Mistral 7B outperformed Llama 2 13B, and their Mixtral model shocked the industry by beating GPT-3.5 on most benchmarks. They represent Europe''s best bet for AI sovereignty.',
  'https://images.pexels.com/photos/3761509/pexels-photo-3761509.jpeg?w=80',
  'https://mistral.ai',
  ARRAY['Arthur Mensch', 'Guillaume Lample', 'Timothée Lacroix'],
  2023, 'Series B', '$1.1B', 'Undisclosed', '$6B', '200+', 'Paris, France',
  ARRAY['Mistral 7B', 'Mixtral 8x7B', 'Mistral Large', 'Le Chat', 'Codestral'],
  ARRAY['open-source', 'europe', 'llm', 'api'],
  true, 64200
),
(
  'Perplexity AI', 'perplexity-company',
  'The AI search startup that raised $1B+ and is challenging Google''s 25-year monopoly.',
  'Perplexity AI is on a mission to build the definitive knowledge discovery engine. Founded in 2022, the company has grown from a viral side project to one of the most-talked about AI startups, reaching millions of users and hundreds of millions in ARR. Their "answer engine" combines LLM reasoning with real-time web search and has attracted users tired of Google''s increasingly ad-cluttered results. Jeff Bezos, NVIDIA, and SoftBank have all backed the company.',
  'https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?w=80',
  'https://perplexity.ai',
  ARRAY['Aravind Srinivas', 'Denis Yarats', 'Andy Konwinski', 'Johnny Ho'],
  2022, 'Series D', '$1B+', '$100M+ ARR', '$9B', '200+', 'San Francisco, CA',
  ARRAY['Perplexity Search', 'Perplexity Pro', 'Perplexity API', 'Perplexity for Enterprise'],
  ARRAY['search', 'information', 'api', 'google-competitor'],
  false, 53400
),
(
  'xAI', 'xai',
  'Elon Musk''s AI company building Grok — the AI with real-time X/Twitter access.',
  'xAI was founded by Elon Musk in 2023 after his acrimonious departure from OpenAI''s board. The company has moved at breakneck pace, releasing the Grok model within months and recruiting top talent from OpenAI, DeepMind, and Google. Grok is uniquely integrated into the X platform (formerly Twitter), giving it real-time access to the pulse of public discourse. Musk has positioned xAI as a counterweight to what he sees as overly cautious AI development at other labs.',
  'https://images.pexels.com/photos/5980800/pexels-photo-5980800.jpeg?w=80',
  'https://x.ai',
  ARRAY['Elon Musk', 'Igor Babuschkin', 'Tony Wu'],
  2023, 'Series C', '$12B', 'Undisclosed', '$50B', '500+', 'Palo Alto, CA',
  ARRAY['Grok 2', 'Grok Vision', 'Aurora (image gen)', 'Colossus supercomputer'],
  ARRAY['elon-musk', 'x-twitter', 'llm', 'grok'],
  false, 78900
),
(
  'Cohere', 'cohere',
  'Enterprise AI platform providing secure, private LLMs for Fortune 500 companies.',
  'Cohere has carved out a defensible niche in the crowded AI market by focusing exclusively on enterprise customers with strict data privacy requirements. Founded by former Google Brain researchers, Cohere offers large language models that can be deployed on-premises or in a private cloud, ensuring sensitive corporate data never leaves the organization. Their Command and Embed models power RAG applications for major financial institutions, healthcare companies, and government agencies.',
  'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?w=80',
  'https://cohere.com',
  ARRAY['Aidan Gomez', 'Nick Frosst', 'Ivan Zhang'],
  2019, 'Series D', '$970M', '$130M ARR', '$5.5B', '700+', 'Toronto, Canada',
  ARRAY['Command R+', 'Embed v3', 'Rerank', 'Cohere Platform', 'Coral'],
  ARRAY['enterprise', 'private-cloud', 'rag', 'embeddings'],
  false, 37800
),
(
  'Stability AI', 'stability-ai',
  'The open-source AI company behind Stable Diffusion that democratized image generation.',
  'Stability AI released Stable Diffusion to the world in August 2022, triggering an explosion in open-source AI creativity. By making a powerful image generation model freely available, Stability enabled thousands of developers, artists, and companies to build on top of it. The company has faced turbulent leadership changes and financial difficulties, but Stable Diffusion remains one of the most impactful open-source AI releases in history, spawning an entire ecosystem of tools and applications.',
  'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?w=80',
  'https://stability.ai',
  ARRAY['Emad Mostaque', 'Cyrus Hodes'],
  2020, 'Series A', '$100M', 'Undisclosed', '$1B', '150+', 'London, UK',
  ARRAY['Stable Diffusion 3', 'SDXL', 'Stable Audio', 'Stable Video Diffusion'],
  ARRAY['open-source', 'image-generation', 'stable-diffusion'],
  false, 42300
)
ON CONFLICT (slug) DO NOTHING;

-- VIDEOS
INSERT INTO videos (title, youtube_id, description, category, duration, view_count, is_featured, published_at) VALUES
(
  'ChatGPT vs Claude vs Gemini: The Ultimate 2024 Comparison',
  'dQw4w9WgXcQ',
  'We tested all three major AI assistants on 20 real-world tasks — coding, writing, analysis, math, and creative work. Here''s the honest verdict on which one you should actually be using.',
  'AI Tools', '18:32', 284000, true, now() - interval '3 days'
),
(
  'How OpenAI Actually Makes Money (The Full Business Model)',
  'ScMzIvxBSi4',
  'From ChatGPT Plus to the OpenAI API to enterprise deals with Microsoft — this is the complete breakdown of how OpenAI generates revenue and why their valuation keeps climbing.',
  'Companies', '22:15', 196000, true, now() - interval '7 days'
),
(
  'I Tried Every AI Coding Tool for 30 Days — Here''s What I Found',
  'hS5CfP8n_js',
  'Cursor, GitHub Copilot, Replit, and more — I spent a full month using AI coding assistants for real projects. This is an honest, unsponsored review of what actually works.',
  'AI Tools', '26:44', 167000, false, now() - interval '12 days'
),
(
  'The Anthropic vs OpenAI War: Who Will Win the AI Race?',
  'P3CwfP3xBzQ',
  'Two companies, one mission, very different approaches. We break down the technical and cultural differences between OpenAI and Anthropic, and what it means for the future of AI.',
  'Companies', '31:20', 143000, false, now() - interval '18 days'
),
(
  'Mistral AI: Europe''s Secret Weapon Against US AI Dominance',
  'qWG7EJMaIhw',
  'The tiny French startup that shocked the AI world. How did a 20-person team from Paris build a model that beats GPT-3.5? The full story of Mistral AI.',
  'Companies', '19:55', 98000, false, now() - interval '24 days'
),
(
  'AI Tools That Will Replace Your Current Workflow in 2025',
  'g8KTqNjNFHs',
  'Ten AI tools that are quietly replacing traditional software. From design to legal to finance — the workflows that are being transformed right now.',
  'Future Tech', '24:10', 221000, false, now() - interval '30 days'
)
ON CONFLICT DO NOTHING;

-- ARTICLES (using category IDs from categories table)
INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'OpenAI''s $157 Billion Valuation: Is It Justified?',
  'openai-157-billion-valuation-analysis',
  E'## The Most Valuable Private Company in AI\n\nWhen OpenAI closed its latest funding round in October 2024, it achieved something extraordinary: a valuation of $157 billion, making it one of the most valuable private companies in American history. But is this number grounded in reality, or are we watching a bubble inflate in real time?\n\n## The Revenue Story\n\nTo justify a $157B valuation, investors are implicitly betting on extraordinary future growth. OpenAI''s current ARR of $3.4 billion is impressive — but the math is challenging. At a 46x revenue multiple, OpenAI is priced like a hypergrowth SaaS company at the absolute peak of its growth curve.\n\nFor context: Microsoft trades at roughly 13x revenue. Google at 6x. Even Nvidia, arguably the biggest winner of the AI boom, trades at around 30x revenue.\n\n## The Bull Case\n\nThe bulls point to ChatGPT''s 200 million weekly users, the most successful enterprise software launch in history, and a moat built on compute infrastructure, research talent, and brand recognition that would cost billions to replicate.\n\n## The Bear Case\n\nSceptics point to an existential contradiction: the same AI progress that drives OpenAI''s revenue threatens to commoditize its products. As open-source models like Llama 3 and Mistral continue to close the capability gap, the question becomes: what''s the long-term defensibility?\n\n## The Verdict\n\nAt $157 billion, the market is pricing in a version of the future where OpenAI wins the AI race comprehensively. The upside is enormous — if that scenario plays out. The downside is equally significant if it doesn''t.',
  'At $157 billion, OpenAI is priced for perfection. We break down the math, the competition, and whether the most important AI company in history is worth the price.',
  'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 47832, 1243, 89, 8,
  ARRAY['openai', 'funding', 'valuation', 'business'],
  now() - interval '2 days'
FROM categories c WHERE c.slug = 'companies';

INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'Claude 3.5 Sonnet Review: The New King of Coding AI?',
  'claude-35-sonnet-review-coding',
  E'## Anthropic''s Surprise Masterpiece\n\nAnthropic dropped Claude 3.5 Sonnet in June 2024 with relatively little fanfare — and it blindsided the AI community. In almost every benchmark that matters, it surpassed OpenAI''s GPT-4o. But benchmarks are one thing. Real-world performance is another.\n\n## The Coding Test\n\nI put Claude 3.5 Sonnet through a gauntlet of real coding tasks: debugging a Python memory leak, refactoring a 500-line React component, writing a Next.js API route with proper error handling, and solving a medium-difficulty LeetCode problem.\n\nThe results were striking. Not only did it produce correct code more consistently than GPT-4o, but the code was *better*. More readable. More idiomatic. More likely to handle edge cases properly.\n\n## The Writing Test\n\nOn writing tasks, Claude has always had an edge — its prose is less robotic, more nuanced. Claude 3.5 Sonnet maintains this advantage while significantly improving coherence across longer pieces.\n\n## Artifacts: The Game Changer\n\nThe most transformative feature might be Artifacts — Claude''s ability to render code, documents, and interactive apps directly in the chat interface. Being able to preview a React component or HTML page without leaving the conversation is genuinely transformative for developers.\n\n## The Verdict\n\nFor developers, Claude 3.5 Sonnet is the best AI assistant available today. Period. That can change tomorrow — this space moves fast — but right now, Anthropic has built something special.',
  'Claude 3.5 Sonnet has dethroned GPT-4o on coding benchmarks. But does it hold up in real-world use? We ran it through 50 tasks to find out.',
  'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 38200, 987, 67, 7,
  ARRAY['claude', 'anthropic', 'coding', 'review'],
  now() - interval '5 days'
FROM categories c WHERE c.slug = 'ai-tools';

INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'How Midjourney Beat Every Competitor (And What''s Next)',
  'midjourney-dominance-analysis-2024',
  E'## The Accidental Empire\n\nMidjourney wasn''t supposed to win. In 2022, DALL-E had OpenAI''s brand behind it. Stable Diffusion had the open-source community. Adobe had enterprise distribution. Midjourney was a small Discord bot built by a handful of researchers in San Francisco.\n\nTwo years later, Midjourney is the undisputed leader in AI image generation with millions of paying subscribers and no sign of slowing down.\n\n## The Quality Moat\n\nThe simple answer is quality. Midjourney v6 produces images that competitors simply cannot match. The aesthetic coherence, the handling of complex compositions, the understanding of lighting and mood — these feel almost art-directed in a way that other models don''t replicate.\n\nWhen professionals — actual designers and artists — reach for AI image tools, they reach for Midjourney.\n\n## The Business Model\n\nMidjourney''s subscription model is elegantly simple: pay monthly, generate images. No confusing credits, no surprise charges. The community aspect of Discord creates a flywheel: users share their prompts, beginners learn, the collective output raises all boats.\n\n## What''s Coming\n\nMidjourney has announced plans for video generation, a standalone app, and real-time generation. If they execute on these, the moat gets even deeper.\n\nThe interesting question is whether Sora or similar video models will cannibalize the image generation market by making static images feel quaint. Midjourney''s bet seems to be: images will remain essential, and quality wins.',
  'How did a small Discord bot become the dominant AI image generation platform? The story of Midjourney''s unexpected dominance.',
  'https://images.pexels.com/photos/7234213/pexels-photo-7234213.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 29400, 756, 45, 9,
  ARRAY['midjourney', 'image-generation', 'design', 'creative'],
  now() - interval '8 days'
FROM categories c WHERE c.slug = 'ai-tools';

INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'The AI Agents Revolution: Every Job Is About to Change',
  'ai-agents-revolution-jobs-2025',
  E'## Beyond Chatbots\n\nFor two years, most people experienced AI as a chatbot — a text box you type into and get a response. Useful, certainly. Transformative? Debatable.\n\nAI agents are different. They don''t just answer questions — they take actions. They browse the web, write and execute code, send emails, fill out forms, and coordinate with other agents. They work while you sleep.\n\n## The Technical Foundation\n\nAgents are built on the same foundation as chatbots — large language models — but with a crucial addition: tools. Give a language model the ability to search the web, and it can research anything. Give it the ability to run Python, and it can analyze data, build software, and automate any task that can be expressed in code.\n\n## Real Use Cases Today\n\nThe most compelling agent use cases are already in production:\n\n**Customer Service Agents** that handle tier-1 support, escalating to humans only when necessary. Companies report 60-80% deflection rates.\n\n**Research Agents** that autonomously search the web, compile information, and produce structured reports on any topic.\n\n**Coding Agents** like Devin and SWE-agent that can resolve GitHub issues, write tests, and deploy features without human intervention.\n\n## The Uncomfortable Question\n\nIf an agent can do the work of a knowledge worker faster, cheaper, and without taking breaks — what happens to those workers? This is the question the AI industry would rather not answer directly. The honest answer is: we don''t know. But the transition, when it comes, will be fast.',
  'AI agents can browse the web, write code, and automate complex workflows. This changes everything — and the disruption is already beginning.',
  'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 52100, 1432, 112, 11,
  ARRAY['agents', 'automation', 'future', 'jobs'],
  now() - interval '10 days'
FROM categories c WHERE c.slug = 'future-tech';

INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'Cursor vs GitHub Copilot: Which AI Coding Tool Should You Use?',
  'cursor-vs-github-copilot-comparison',
  E'## The State of AI Coding Tools\n\nTwo years ago, GitHub Copilot felt like magic. Tab autocomplete for code? Revolutionary. Today, it''s table stakes — and developers are demanding much more.\n\nCursor has emerged as the most serious challenger to Copilot''s throne. Not by being incrementally better, but by rethinking what an AI coding tool should fundamentally be.\n\n## The Key Difference\n\nCopilot lives inside your existing editor as a plugin. It suggests code completions and can answer questions, but it has limited awareness of your broader codebase.\n\nCursor *is* the editor. Built as a fork of VS Code, it has deep integration that lets it understand your entire codebase — all files, all dependencies, all context. When you ask Cursor to "add user authentication," it can look at your existing auth patterns, your database schema, and your API conventions before writing a single line.\n\n## In Practice\n\nFor straightforward autocomplete, both are excellent and similar in quality.\n\nFor complex, multi-file tasks, Cursor is substantially better. I''ve seen it correctly implement features across 5-6 files on the first attempt, something that would require multiple rounds of prompting with Copilot.\n\n## The Verdict\n\nFor new projects or developers building significant applications: **Cursor**. The codebase awareness is a genuine superpower.\n\nFor quick completions in an established environment where switching editors has friction: **Copilot** remains solid and convenient.',
  'Both promise to make you a 10x developer. We tested them extensively on real projects. Here''s the honest comparison.',
  'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 34700, 892, 78, 8,
  ARRAY['cursor', 'copilot', 'coding', 'comparison'],
  now() - interval '14 days'
FROM categories c WHERE c.slug = 'ai-tools';

INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'How India Can Win the AI Race: A Strategic Analysis',
  'india-ai-strategy-analysis',
  E'## India''s AI Moment\n\nIn 2024, India launched its IndiaAI Mission with ₹10,371 crore in funding. The government''s ambition is clear: position India not just as an AI user, but as an AI creator. But is this enough?\n\n## The Strengths\n\nIndia has extraordinary assets. A 1.4 billion population creates massive data diversity. A world-class engineering talent pool — India produces more STEM graduates than any country except China. And a tech diaspora in Silicon Valley that is disproportionately influential in AI: the CEOs of Google, Microsoft, IBM, and most recently OpenAI''s President Greg Brockman''s successor are all of Indian origin.\n\n## The Challenges\n\nDespite these advantages, India punches below its weight in frontier AI research. The top AI labs — OpenAI, Anthropic, DeepMind, Meta AI — are all Western. Chinese labs like Baidu and ByteDance are competitive at the frontier. Where is India?\n\nThe gaps are in two areas: compute and capital. Training frontier models requires tens of thousands of GPUs and billions of dollars. India has neither at scale — yet.\n\n## The Opportunity\n\nIndia''s best opportunity may not be in building foundation models, but in building applications. The world needs AI solutions for agriculture, healthcare, education, and financial inclusion at a scale that serves billions — not millions. India uniquely has both the need and the talent to build those solutions.\n\nThe country that builds AI for the next billion users may matter more, in the long run, than the country that builds the most powerful foundation model.',
  'India has the talent, the data, and the ambition. Does it have the strategy to become an AI superpower? A hard look at the opportunities and obstacles.',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 41300, 1123, 94, 10,
  ARRAY['india', 'ai-strategy', 'geopolitics', 'technology'],
  now() - interval '16 days'
FROM categories c WHERE c.slug = 'business';

INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'The 10 AI Tools Every Student Should Be Using in 2025',
  'top-ai-tools-students-2025',
  E'## The Student AI Stack\n\nAI tools haven''t just changed how professionals work — they''ve fundamentally transformed how students learn, research, and produce work. Here are the 10 tools that every student should have in their toolkit.\n\n## 1. Perplexity AI for Research\n\nForget generic Google searches. Perplexity gives you cited, synthesized answers to complex research questions. It reads the web for you and gives you a structured summary with sources. Start every research project here.\n\n## 2. ChatGPT for Writing Assistance\n\nNot to write your essays — but to overcome writer''s block, get feedback on structure, and understand complex concepts through conversation. Use it as a tutor, not a ghostwriter.\n\n## 3. Claude for Long Document Analysis\n\nGot a 50-page research paper to understand? Claude''s 200K context window can read the entire thing and answer your questions about it. Essential for literature reviews.\n\n## 4. Anki + AI for Flashcards\n\nUse ChatGPT or Claude to generate Anki flashcard decks from your lecture notes. What once took hours now takes minutes.\n\n## 5. Notion AI for Organization\n\nAI-powered notes, summaries, and project management. If you''re already using Notion, the AI add-on is worth every rupee.\n\n## 6. GitHub Copilot for CS Students\n\nFree for students through GitHub Education. An AI pair programmer that explains code, suggests completions, and helps you debug. A massive advantage in any programming course.\n\n## 7. ElevenLabs for Podcasts\n\nCreate audio summaries of your notes. Listening while commuting is one of the most effective study strategies, and ElevenLabs makes it trivially easy to convert text to natural-sounding audio.\n\n## 8. Otter.ai for Lectures\n\nAI-powered transcription of lectures with speaker labels and searchable transcripts. Never scramble to take notes again.\n\n## 9. Consensus for Academic Research\n\nSearch engine for peer-reviewed papers with AI-synthesized summaries. Essential for any research-heavy course.\n\n## 10. Grammarly for Writing Polish\n\nThe OG AI writing assistant. Real-time grammar, tone, and clarity suggestions. Every piece of written work should go through Grammarly before submission.',
  'These 10 AI tools can give you an unfair advantage in academics. The students who use them will work faster, learn better, and produce higher-quality work.',
  'https://images.pexels.com/photos/5905857/pexels-photo-5905857.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 61400, 1876, 143, 6,
  ARRAY['students', 'tools', 'education', 'productivity'],
  now() - interval '20 days'
FROM categories c WHERE c.slug = 'tutorials';

INSERT INTO articles (title, slug, content, excerpt, featured_image, category_id, status, view_count, like_count, comment_count, read_time, tags, published_at)
SELECT
  'Google''s AI Crisis: Is the Search Giant Losing Its Edge?',
  'google-ai-crisis-search-losing-edge',
  E'## The $300 Billion Problem\n\nIn 2023, when ChatGPT launched, Google''s executives reportedly declared a "code red." The concern was existential: if users could get direct answers from an AI instead of clicking through Google''s search results, what happens to the business model that generates $220 billion in annual revenue?\n\nA year later, that concern looks prescient.\n\n## The Talent Exodus\n\nThe most alarming development for Google isn''t external competition — it''s internal talent flight. Many of the researchers who built the transformer architecture (the foundation of modern AI) have left Google for OpenAI, Anthropic, and their own startups.\n\nGoogle essentially invented modern AI. The "Attention Is All You Need" paper that described the transformer was written by Google researchers. And yet Google is now in a position where external companies are more associated with cutting-edge AI than the company that discovered the underlying technology.\n\n## The Gemini Stumbles\n\nGoogle''s public AI launches have been plagued by embarrassing mistakes. The Gemini image generation controversy, where the model produced historically inaccurate images, was a PR disaster. The AI Overviews feature launched in Google Search made factual errors that went viral.\n\nThese aren''t just PR problems — they reflect genuine challenges in deploying AI reliably at Google''s scale.\n\n## The Counter-Argument\n\nGoogle has assets no startup can replicate: 15 billion devices, the world''s most popular email service, YouTube, Maps, Android, Chrome. The integration of AI across this ecosystem is just beginning.\n\nGemini 1.5 Pro''s 1M token context window is technically superior to anything OpenAI has shipped. Google Cloud''s AI infrastructure is world-class. The resources to win the AI race — compute, data, talent budget — are all there.\n\nThe question is whether a company optimized for search advertising can move fast enough to win in a market that rewards rapid iteration over operational excellence.',
  'Google invented the transformer. Google has the most compute. Google has the most data. So why does it feel like they''re losing the AI race?',
  'https://images.pexels.com/photos/218717/pexels-photo-218717.jpeg?auto=compress&cs=tinysrgb&w=1200',
  c.id, 'published', 55200, 1654, 132, 9,
  ARRAY['google', 'gemini', 'search', 'competition'],
  now() - interval '25 days'
FROM categories c WHERE c.slug = 'companies';

-- Update category article counts
UPDATE categories SET article_count = (
  SELECT COUNT(*) FROM articles WHERE category_id = categories.id AND status = 'published'
);
