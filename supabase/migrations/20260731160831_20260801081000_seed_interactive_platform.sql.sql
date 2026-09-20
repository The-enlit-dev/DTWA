/*
# Seed Interactive Platform: Skill Tree, Badges, Ideas, Challenges, Predictions

## Data inserted
- 24 skill_nodes across 8 categories (AI Basics, Prompt Engineering, LLMs, RAG,
  AI Agents, Automation, Fine-Tuning, AI Business) — 3 nodes each, progressive difficulty.
- 12 badges (achievement definitions) with XP rewards.
- 12 business_ideas across categories with market size, monetization, difficulty.
- 3 challenges (1 active, 1 voting, 1 upcoming) spanning build/design/launch themes.
- 5 predictions (AGI year, OpenAI valuation, top AI company 2030, AI replacing jobs,
  future model capabilities) with trending flags.

## Security
- No schema or policy changes. Insert-only seed data.

## Notes
- All inserts use ON CONFLICT DO NOTHING so re-running is safe.
*/

-- ============ SKILL NODES ============
INSERT INTO skill_nodes (category, node_key, title, description, xp_reward, difficulty, prerequisites, "order") VALUES
('AI Basics','ai-basics-1','What is AI?','Understand the difference between AI, ML, and deep learning in plain language.',50,1,'{}',1),
('AI Basics','ai-basics-2','Types of AI Systems','Learn narrow vs general AI, supervised vs unsupervised learning, and reinforcement learning.',75,2,'{ai-basics-1}',2),
('AI Basics','ai-basics-3','AI History & Milestones','Trace the key breakthroughs from perceptrons to GPT and beyond.',100,2,'{ai-basics-1,ai-basics-2}',3),
('Prompt Engineering','prompt-1','Prompt Fundamentals','Master the anatomy of an effective prompt: context, instruction, format, and constraints.',50,1,'{}',1),
('Prompt Engineering','prompt-2','Advanced Prompt Patterns','Learn few-shot, chain-of-thought, and role-based prompting techniques.',100,2,'{prompt-1}',2),
('Prompt Engineering','prompt-3','Prompt Engineering for Production','Build reusable prompt templates, handle edge cases, and evaluate prompt quality.',150,3,'{prompt-1,prompt-2}',3),
('LLMs','llm-1','How LLMs Work','Understand tokens, context windows, embeddings, and transformer architecture at a high level.',75,2,'{}',1),
('LLMs','llm-2','Comparing Top LLMs','Compare GPT-4o, Claude, Gemini, and open models on benchmarks, cost, and use cases.',100,2,'{llm-1}',2),
('LLMs','llm-3','LLM Limitations & Hallucinations','Learn why models hallucinate and how to mitigate risks in production.',150,3,'{llm-1,llm-2}',3),
('RAG','rag-1','RAG Fundamentals','Understand retrieval-augmented generation: why it matters and how it reduces hallucinations.',75,2,'{llm-1}',1),
('RAG','rag-2','Building a RAG Pipeline','Learn chunking, embeddings, vector databases, and retrieval strategies step by step.',150,3,'{rag-1}',2),
('RAG','rag-3','Advanced RAG: Re-ranking & Citations','Implement re-ranking, hybrid search, and citation grounding for production RAG.',200,3,'{rag-1,rag-2}',3),
('AI Agents','agent-1','What are AI Agents?','Understand agentic loops, tool use, and the difference between chains and agents.',75,2,'{llm-1}',1),
('AI Agents','agent-2','Building Your First Agent','Learn function calling, tool definitions, and multi-step agent orchestration.',150,3,'{agent-1}',2),
('AI Agents','agent-3','Multi-Agent Systems','Explore agent collaboration, delegation, and frameworks like CrewAI and AutoGen.',200,3,'{agent-1,agent-2}',3),
('Automation','auto-1','No-Code AI Automation','Automate repetitive tasks with no-code tools like Zapier, Make, and n8n.',50,1,'{}',1),
('Automation','auto-2','API-Based Automation','Connect AI to your tools via APIs: webhooks, schedules, and data pipelines.',100,2,'{auto-1}',2),
('Automation','auto-3','End-to-End Workflow Automation','Design and ship a complete automated workflow from trigger to output.',150,3,'{auto-1,auto-2}',3),
('Fine-Tuning','ft-1','When to Fine-Tune','Learn when fine-tuning helps vs when prompting or RAG is the better choice.',75,2,'{llm-1}',1),
('Fine-Tuning','ft-2','Fine-Tuning Methods','Understand LoRA, QLoRA, and full fine-tuning — and their trade-offs.',150,3,'{ft-1}',2),
('Fine-Tuning','ft-3','Evaluating Fine-Tuned Models','Build evaluation pipelines to measure improvements and catch regressions.',200,3,'{ft-1,ft-2}',3),
('AI Business','biz-1','AI Business Models','Explore SaaS, API, marketplace, and embedded AI business models.',75,2,'{}',1),
('AI Business','biz-2','Pricing AI Products','Learn usage-based, tiered, and value-based pricing strategies for AI products.',100,2,'{biz-1}',2),
('AI Business','biz-3','Go-to-Market for AI Startups','Master positioning, distribution, and growth loops for AI-native products.',150,3,'{biz-1,biz-2}',3)
ON CONFLICT (node_key) DO NOTHING;

-- ============ BADGES ============
INSERT INTO badges (badge_key, name, description, icon, color, xp_reward, requirement) VALUES
('first_steps','First Steps','Complete your first skill node','Footprints','#4A6CF7',50,'Complete 1 skill node'),
('ai_explorer','AI Explorer','Complete all AI Basics nodes','Compass','#10b981',100,'Complete all AI Basics skills'),
('prompt_master','Prompt Master','Complete the Prompt Engineering track','Terminal','#7b2fbe',150,'Complete all Prompt Engineering skills'),
('llm_scholar','LLM Scholar','Complete the LLMs track','Brain','#ff006e',150,'Complete all LLM skills'),
('rag_architect','RAG Architect','Complete the RAG track','Database','#f59e0b',200,'Complete all RAG skills'),
('agent_builder','Agent Builder','Complete the AI Agents track','Bot','#06b6d4',200,'Complete all AI Agents skills'),
('automation_pro','Automation Pro','Complete the Automation track','Zap','#84cc16',150,'Complete all Automation skills'),
('fine_tuning_expert','Fine-Tuning Expert','Complete the Fine-Tuning track','Settings2','#ec4899',200,'Complete all Fine-Tuning skills'),
('biz_strategist','Business Strategist','Complete the AI Business track','Briefcase','#f97316',150,'Complete all AI Business skills'),
('founder','Startup Founder','Reach a winning outcome in the AI Startup Simulator','Rocket','#4A6CF7',300,'Win the AI Startup Simulator'),
('predictor','Predictor','Submit your first prediction forecast','Eye','#10b981',50,'Vote on a prediction'),
('builder','Builder','Publish your first project','Hammer','#7b2fbe',100,'Publish a project in the Build-in-Public hub')
ON CONFLICT (badge_key) DO NOTHING;

-- ============ BUSINESS IDEAS ============
INSERT INTO business_ideas (title, slug, pitch, description, category, difficulty, market_size, monetization, tech_stack, tags) VALUES
('AI Resume Tailor','ai-resume-tailor','An AI tool that tailors resumes to specific job descriptions in seconds.','Users paste a job link and their resume. The tool rewrites bullet points to match keywords, optimizes for ATS scoring, and generates a cover letter. Target job seekers and bootcamps.','Developer Tools','easy','$2B (job search tech)','Freemium: free basic tailoring, $9/mo Pro for unlimited + cover letters',ARRAY['Next.js','OpenAI API','Supabase'],ARRAY['resume','jobs','ats','career']),
('AI Meeting Notes','ai-meeting-notes','Real-time meeting transcription with AI summaries and action items.','A browser extension or desktop app that transcribes meetings, extracts action items, and syncs to Notion/Slack. Compete with Otter.ai but cheaper for individuals.','Productivity','medium','$5B (meeting intelligence)','$8/mo Pro, $20/mo Team',ARRAY['Electron','Whisper API','Next.js'],ARRAY['meetings','transcription','productivity']),
('AI Code Reviewer','ai-code-reviewer','Automated code review that catches bugs and suggests improvements before PR merge.','A GitHub app that reviews pull requests with an LLM: catches bugs, suggests tests, enforces style. Unlike Copilot, it focuses on review quality not generation.','Developer Tools','hard','$8B (dev tools)','$15/user/mo for teams',ARRAY['Node.js','GitHub API','Claude API'],ARRAY['code-review','github','devtools']),
('AI Content Repurposer','ai-content-repurposer','Turn one blog post into 10 social posts, a newsletter, and a video script.','Paste a URL or text. The tool generates platform-specific content (Twitter threads, LinkedIn posts, YouTube scripts) maintaining brand voice.','Marketing','easy','$3B (content marketing)','$19/mo Pro, $49/mo Agency',ARRAY['Next.js','OpenAI API','Supabase'],ARRAY['content','social','marketing','repurpose']),
('AI Legal Assistant','ai-legal-assistant','Plain-language explanations of legal documents for non-lawyers.','Upload a contract or terms of service. Get a plain-language summary, red flags, and comparison to industry norms. Not legal advice, but education.','Legal','hard','$4B (legal tech)','$12/mo Pro, $30/mo Business',ARRAY['React','Claude API','Postgres'],ARRAY['legal','contracts','analysis']),
('AI Customer Support Bot','ai-customer-support-bot','A support bot trained on your docs that actually resolves tickets.','Connect your help docs and ticket history. The bot answers customers, escalates when unsure, and drafts responses for agents. Focus on resolution rate.','Customer Support','medium','$10B (customer support AI)','$49/mo Starter, $199/mo Growth',ARRAY['Next.js','RAG','OpenAI API'],ARRAY['support','chatbot','customer-service']),
('AI Personal Trainer','ai-personal-trainer','AI-generated workout and nutrition plans that adapt to your progress.','Users input goals, equipment, and preferences. The app creates a weekly plan, adjusts based on logged workouts, and explains form with AI videos.','Health','medium','$6B (fitness apps)','$9/mo Premium',ARRAY['React Native','OpenAI API','Supabase'],ARRAY['fitness','health','workout','nutrition']),
('AI Study Companion','ai-study-companion','An AI tutor that creates flashcards, quizzes, and explanations from your notes.','Upload lecture notes or a textbook chapter. Get auto-generated flashcards (Spaced repetition), practice quizzes, and a chat tutor that explains concepts.','Education','easy','$3B (edtech)','$7/mo Student, $15/mo Pro',ARRAY['Next.js','OpenAI API','Postgres'],ARRAY['education','studying','flashcards','tutor']),
('AI Sales Prospecting','ai-sales-prospecting','AI that finds and enriches leads, then writes personalized outreach.','Input your ICP. The tool scrapes LinkedIn/company sites, enriches with firmographics, and drafts personalized cold emails at scale with variable personalization.','Sales','hard','$7B (sales tech)','$39/mo Pro, $99/mo Team',ARRAY['Node.js','Apollo API','GPT-4o'],ARRAY['sales','leads','outreach','b2b']),
('AI Image Organizer','ai-image-organizer','Automatically tag, categorize, and search your photo library by content.','A desktop or web app that uses vision models to auto-tag photos, detect duplicates, and let you search by natural language ("sunset beach 2023").','Productivity','medium','$2B (photo management)','$5/mo, $12/mo Family',ARRAY['Electron','CLIP','SQLite'],ARRAY['photos','organization','vision','search']),
('AI Financial Analyzer','ai-financial-analyzer','Connect your accounts; get AI insights on spending, savings, and investments.','Aggregates transactions, categorizes spending, and provides plain-language insights and alerts. Suggests optimizations. Not investment advice.','Finance','hard','$5B (fintech AI)','$8/mo Plus, $20/mo Wealth',ARRAY['Plaid API','Next.js','Claude API'],ARRAY['finance','budgeting','investing','insights']),
('AI Podcast Clipper','ai-podcast-clipper','Auto-find the best moments in your podcast and generate short clips with captions.','Upload audio/video. AI identifies highlight moments, creates vertical clips with animated captions, and schedules to social platforms.','Media','medium','$2B (podcast tools)','$15/mo Creator, $39/mo Pro',ARRAY['FFmpeg','Whisper','Next.js'],ARRAY['podcast','video','clips','social'])
ON CONFLICT (slug) DO NOTHING;

-- ============ CHALLENGES ============
INSERT INTO challenges (title, slug, description, prompt, category, difficulty, xp_reward, starts_at, ends_at, status) VALUES
('Build an AI Tool in 7 Days','build-ai-tool-7-days','Build and ship a working AI-powered tool in one week.','Pick one problem, build a focused AI tool that solves it, and ship it publicly. Submit your live link and a short description. Voters judge usefulness, polish, and creativity.','Build','medium',250,now() - interval '2 days', now() + interval '5 days','active'),
('Design an AI Workflow','design-ai-workflow','Design the most creative and useful AI-powered automation workflow.','Map out (or build) an AI workflow that automates a real task — from trigger to output. Submit a diagram or Loom walkthrough. Voters judge originality and practical value.','Design','easy',150,now() - interval '9 days', now() - interval '2 days','voting'),
('Launch a Mini AI Startup','launch-mini-startup','Build a landing page, collect signups, and pitch a mini AI startup in a weekend.','Create a landing page for an AI product idea, collect at least 10 signups, and write a 200-word pitch. Voters judge the idea, positioning, and execution.','Launch','hard',350,now() + interval '3 days', now() + interval '17 days','upcoming')
ON CONFLICT (slug) DO NOTHING;

-- ============ PREDICTIONS ============
INSERT INTO predictions (title, slug, description, category, type, options, target_date, is_trending, vote_count) VALUES
('When will AGI be achieved?','agi-arrival-year','Predict the year when Artificial General Intelligence is achieved and publicly demonstrated.','AGI Timeline','year','{}','2050-01-01',true,0),
('What will OpenAI be valued at in 2026?','openai-valuation-2026','Forecast OpenAI valuation range by end of 2026 following its latest funding rounds.','Funding','choice',ARRAY['Under $150B','$150B–$250B','$250B–$500B','Over $500B'],'2026-12-31',true,0),
('Which company will lead AI in 2030?','top-ai-company-2030','Which company will be the dominant AI player by 2030?','Industry','choice',ARRAY['OpenAI','Google DeepMind','Anthropic','xAI','Meta AI','Other'],'2030-12-31',true,0),
('Will AI replace bookkeepers by 2028?','ai-replace-bookkeepers-2028','Will AI automate the majority of bookkeeping tasks by 2028?','Jobs','yesno','{}','2028-12-31',false,0),
('Will a model pass the Turing Test for 30 min by 2026?','turing-test-2026','Will an AI model convincingly pass a 30-minute Turing Test with expert judges by end of 2026?','Capabilities','yesno','{}','2026-12-31',false,0)
ON CONFLICT (slug) DO NOTHING;
