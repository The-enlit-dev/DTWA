/*
  # Programmatic SEO — Glossary & Article SEO Architecture
  
  1. glossary_terms table with full SEO fields, FAQ, related terms
  2. SEO fields added to articles table
  3. editor_permissions extended with 'glossary' content_type
  4. Seed all 50 existing glossary terms with slugs, SEO metadata, related term links
*/

-- ─── 1. GLOSSARY TERMS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.glossary_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  slug text UNIQUE NOT NULL,
  simple_explanation text DEFAULT '',
  detailed_explanation text DEFAULT '',
  example text DEFAULT '',
  category text DEFAULT 'General',
  tags text[] DEFAULT '{}',
  related_term_slugs text[] DEFAULT '{}',
  faq jsonb DEFAULT '[]'::jsonb,
  -- SEO
  seo_title text DEFAULT '',
  meta_description text DEFAULT '',
  primary_keyword text DEFAULT '',
  secondary_keywords text[] DEFAULT '{}',
  og_image text DEFAULT '',
  canonical_url text DEFAULT '',
  -- Status & metrics
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  view_count integer DEFAULT 0,
  -- Author
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published glossary terms are publicly readable"
  ON public.glossary_terms FOR SELECT TO authenticated, anon
  USING (status = 'published' OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'editor')
    )
  ));

CREATE POLICY "Admins and editors can insert glossary terms"
  ON public.glossary_terms FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))
    OR EXISTS (SELECT 1 FROM public.editor_permissions WHERE user_id = auth.uid() AND content_type = 'glossary')
  );

CREATE POLICY "Admins and editors can update glossary terms"
  ON public.glossary_terms FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))
    OR EXISTS (SELECT 1 FROM public.editor_permissions WHERE user_id = auth.uid() AND content_type = 'glossary')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor'))
    OR EXISTS (SELECT 1 FROM public.editor_permissions WHERE user_id = auth.uid() AND content_type = 'glossary')
  );

CREATE POLICY "Admins can delete glossary terms"
  ON public.glossary_terms FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

CREATE INDEX IF NOT EXISTS glossary_terms_slug_idx ON public.glossary_terms(slug);
CREATE INDEX IF NOT EXISTS glossary_terms_status_idx ON public.glossary_terms(status);
CREATE INDEX IF NOT EXISTS glossary_terms_category_idx ON public.glossary_terms(category);

-- ─── 2. SEO FIELDS ON ARTICLES ──────────────────────────────────────────────
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS seo_title text DEFAULT '';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS meta_description text DEFAULT '';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS primary_keyword text DEFAULT '';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS secondary_keywords text[] DEFAULT '{}';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS canonical_url text DEFAULT '';

-- ─── 3. EDITOR PERMISSIONS — ADD 'glossary' ──────────────────────────────────
ALTER TABLE public.editor_permissions DROP CONSTRAINT IF EXISTS editor_permissions_content_type_check;
ALTER TABLE public.editor_permissions ADD CONSTRAINT editor_permissions_content_type_check
  CHECK (content_type IN ('articles','tools','companies','reviews','newsletter','glossary'));

-- ─── 4. SEED 50 GLOSSARY TERMS ───────────────────────────────────────────────
INSERT INTO public.glossary_terms (term, slug, simple_explanation, example, category, tags, related_term_slugs, seo_title, meta_description, primary_keyword, secondary_keywords, status, published_at) VALUES

('Artificial Intelligence (AI)', 'artificial-intelligence',
 'The simulation of human intelligence processes by computer systems — including learning, reasoning, problem-solving, and understanding language.',
 'ChatGPT generating a human-like response to your question.',
 'Foundations',
 ARRAY['ai','machine learning','intelligence','automation'],
 ARRAY['machine-learning','deep-learning','neural-network','large-language-model'],
 'What is Artificial Intelligence (AI)? | AI Glossary',
 'Learn what Artificial Intelligence (AI) is in plain language. Includes definition, examples, and how it relates to machine learning and LLMs.',
 'artificial intelligence', ARRAY['AI meaning','what is AI','AI definition','AI explained'],
 'published', now()),

('Machine Learning (ML)', 'machine-learning',
 'A subset of AI where systems learn from data to improve their performance on a task without being explicitly programmed for each case.',
 'A spam filter that learns to detect new spam patterns from labeled emails.',
 'Foundations',
 ARRAY['ml','supervised learning','training','data'],
 ARRAY['deep-learning','neural-network','fine-tuning','reinforcement-learning','artificial-intelligence'],
 'What is Machine Learning (ML)? | AI Glossary',
 'Machine Learning explained simply. Understand how ML works, the difference from AI, and real-world examples.',
 'machine learning', ARRAY['ML definition','machine learning explained','what is ML'],
 'published', now()),

('Deep Learning', 'deep-learning',
 'A type of machine learning using neural networks with many layers (hence "deep") to learn increasingly abstract representations of data.',
 NULL,
 'Foundations',
 ARRAY['deep learning','neural networks','layers','representation learning'],
 ARRAY['neural-network','machine-learning','transformer','diffusion-model'],
 'What is Deep Learning? | AI Glossary',
 'Deep learning explained simply. Learn how deep neural networks work and why they power modern AI.',
 'deep learning', ARRAY['deep learning definition','deep neural networks','what is deep learning'],
 'published', now()),

('Neural Network', 'neural-network',
 'A computing system loosely inspired by the human brain, made up of interconnected nodes (neurons) organized in layers that process and transform data.',
 NULL,
 'Foundations',
 ARRAY['neural network','neurons','layers','weights'],
 ARRAY['deep-learning','machine-learning','transformer'],
 'What is a Neural Network? | AI Glossary',
 'Neural networks explained simply. Understand how artificial neural networks work and why they are the foundation of modern AI.',
 'neural network', ARRAY['neural network definition','artificial neural network','how neural networks work'],
 'published', now()),

('Large Language Model (LLM)', 'large-language-model',
 'A type of AI model trained on massive amounts of text data to understand and generate human language. These are the models behind ChatGPT, Claude, and Gemini.',
 'GPT-4, Claude 3.5 Sonnet, Llama 3 are all LLMs.',
 'Models',
 ARRAY['llm','language model','gpt','claude','gemini'],
 ARRAY['transformer','token','context-window','fine-tuning','rlhf','foundation-model'],
 'What is a Large Language Model (LLM)? | AI Glossary',
 'LLM explained simply. Learn what large language models are, how they work, and why GPT-4 and Claude are LLMs.',
 'large language model', ARRAY['LLM definition','what is LLM','large language model explained'],
 'published', now()),

('Transformer', 'transformer',
 'The neural network architecture that powers virtually all modern LLMs. Introduced in the 2017 paper "Attention Is All You Need" — it processes entire sequences in parallel using attention mechanisms.',
 NULL,
 'Architecture',
 ARRAY['transformer','architecture','attention','self-attention'],
 ARRAY['attention-mechanism','large-language-model','neural-network','mixture-of-experts'],
 'What is a Transformer in AI? | AI Glossary',
 'The transformer architecture explained simply. Learn how transformers power ChatGPT, Claude, and every modern LLM.',
 'transformer architecture', ARRAY['transformer model','what is transformer AI','attention is all you need'],
 'published', now()),

('Attention Mechanism', 'attention-mechanism',
 'A technique that allows AI models to focus on different parts of the input when generating output — like how you pay more attention to key words when reading a sentence.',
 NULL,
 'Architecture',
 ARRAY['attention','self-attention','transformer','focus'],
 ARRAY['transformer','large-language-model'],
 'What is the Attention Mechanism in AI? | AI Glossary',
 'The attention mechanism explained simply. Understand how AI models decide which parts of the input to focus on.',
 'attention mechanism', ARRAY['self-attention','attention in transformers','attention mechanism explained'],
 'published', now()),

('Token', 'token',
 'The basic unit of text that LLMs process. A token is roughly 4 characters or ¾ of a word. Models have a "context window" measured in tokens.',
 '"ChatGPT" is approximately 3 tokens: "Chat", "G", "PT".',
 'Models',
 ARRAY['token','tokenization','context window','text'],
 ARRAY['large-language-model','context-window','tokenizer'],
 'What is a Token in AI? | AI Glossary',
 'AI tokens explained simply. Understand what tokens are, how tokenization works, and why token count matters for LLMs.',
 'token AI', ARRAY['what is a token LLM','token definition AI','tokenization'],
 'published', now()),

('Context Window', 'context-window',
 'The maximum amount of text (in tokens) an LLM can process at once — both the input and output combined. Larger context windows let models handle longer documents.',
 'Claude''s 200K token context can process an entire novel in one go.',
 'Models',
 ARRAY['context window','context length','tokens','memory'],
 ARRAY['large-language-model','token'],
 'What is a Context Window in AI? | AI Glossary',
 'Context window explained simply. Learn what a context window is and why it matters for large language models.',
 'context window', ARRAY['context length LLM','context window definition','what is context window'],
 'published', now()),

('Prompt', 'prompt',
 'The input text you give to an AI model to guide its response. Crafting effective prompts is called "prompt engineering".',
 NULL,
 'Usage',
 ARRAY['prompt','input','instruction','query'],
 ARRAY['prompt-engineering','chain-of-thought','system-prompt','few-shot-learning'],
 'What is an AI Prompt? | AI Glossary',
 'AI prompt explained simply. Learn what a prompt is and how the right prompt gets better AI outputs.',
 'AI prompt', ARRAY['prompt definition AI','what is a prompt','AI input'],
 'published', now()),

('Prompt Engineering', 'prompt-engineering',
 'The practice of designing and refining inputs to AI models to get better, more consistent, or more useful outputs.',
 'Adding "Think step by step" to a prompt often improves the quality of AI reasoning.',
 'Usage',
 ARRAY['prompt engineering','prompting','instructions','optimization'],
 ARRAY['prompt','chain-of-thought','few-shot-learning','zero-shot-learning','system-prompt'],
 'What is Prompt Engineering? | AI Glossary',
 'Prompt engineering explained simply. Learn the techniques that get better, more consistent AI outputs.',
 'prompt engineering', ARRAY['prompt engineering definition','how to prompt AI','prompting techniques'],
 'published', now()),

('Fine-tuning', 'fine-tuning',
 'Further training a pre-trained model on a specific dataset to specialize it for a particular task or domain.',
 NULL,
 'Training',
 ARRAY['fine-tuning','training','specialization','dataset'],
 ARRAY['pre-training','large-language-model','rlhf','distillation'],
 'What is Fine-tuning in AI? | AI Glossary',
 'Fine-tuning explained simply. Learn how fine-tuning adapts pre-trained AI models for specific tasks.',
 'fine-tuning AI', ARRAY['fine-tuning definition','model fine-tuning','what is fine-tuning LLM'],
 'published', now()),

('Pre-training', 'pre-training',
 'The initial large-scale training phase where an LLM learns general language understanding from vast amounts of text data before being specialized.',
 NULL,
 'Training',
 ARRAY['pre-training','training','foundation','large-scale'],
 ARRAY['fine-tuning','large-language-model','foundation-model'],
 'What is Pre-training in AI? | AI Glossary',
 'Pre-training explained simply. Understand the first phase of training LLMs on massive text datasets.',
 'pre-training AI', ARRAY['pre-training definition','what is pre-training LLM','model pre-training'],
 'published', now()),

('RLHF (Reinforcement Learning from Human Feedback)', 'rlhf',
 'A training technique where humans rate AI outputs and those ratings are used to train the model to produce better, more aligned responses. Used to make ChatGPT and Claude conversational.',
 NULL,
 'Training',
 ARRAY['rlhf','reinforcement learning','human feedback','alignment','training'],
 ARRAY['fine-tuning','reinforcement-learning','alignment'],
 'What is RLHF (Reinforcement Learning from Human Feedback)? | AI Glossary',
 'RLHF explained simply. Learn how reinforcement learning from human feedback made ChatGPT safe and helpful.',
 'RLHF', ARRAY['reinforcement learning from human feedback','RLHF definition','RLHF explained','how ChatGPT was trained'],
 'published', now()),

('RAG (Retrieval-Augmented Generation)', 'rag',
 'A technique that combines a language model with a search system — the model retrieves relevant documents from a database and uses them to generate more accurate, grounded answers.',
 'A customer support bot that searches your docs before answering user questions.',
 'Architecture',
 ARRAY['rag','retrieval','generation','search','grounding'],
 ARRAY['embedding','vector-database','large-language-model','semantic-search'],
 'What is RAG (Retrieval-Augmented Generation)? | AI Glossary',
 'RAG explained simply. Learn how retrieval-augmented generation reduces hallucinations and grounds AI answers in real data.',
 'RAG retrieval augmented generation', ARRAY['retrieval augmented generation','RAG definition','RAG vs fine-tuning','what is RAG'],
 'published', now()),

('Embedding', 'embedding',
 'A numerical representation (vector) of text, images, or other data that captures semantic meaning. Similar concepts have similar embeddings, enabling similarity search.',
 'The embeddings for "cat" and "kitten" are closer together than "cat" and "keyboard".',
 'Architecture',
 ARRAY['embedding','vector','semantic','representation'],
 ARRAY['rag','vector-database','semantic-search'],
 'What is an Embedding in AI? | AI Glossary',
 'Embeddings explained simply. Learn how AI converts words and images into numbers that capture meaning.',
 'AI embedding', ARRAY['embedding definition AI','what is an embedding','vector embedding','word embedding'],
 'published', now()),

('Vector Database', 'vector-database',
 'A database optimized for storing and querying embeddings (vectors) — enabling fast similarity search across millions of items. Used heavily in RAG systems.',
 'Pinecone, Weaviate, Qdrant are popular vector databases.',
 'Infrastructure',
 ARRAY['vector database','similarity search','embeddings','pinecone','weaviate'],
 ARRAY['embedding','rag'],
 'What is a Vector Database? | AI Glossary',
 'Vector databases explained simply. Learn how vector databases power semantic search and RAG applications.',
 'vector database', ARRAY['vector database definition','vector store','semantic search database','pinecone weaviate'],
 'published', now()),

('Hallucination', 'hallucination',
 'When an AI model generates information that sounds plausible but is factually incorrect or entirely made up. A major challenge for LLMs in production.',
 'An LLM confidently citing a research paper that does not actually exist.',
 'Limitations',
 ARRAY['hallucination','confabulation','factual errors','reliability'],
 ARRAY['large-language-model','alignment','rag'],
 'What is AI Hallucination? | AI Glossary',
 'AI hallucination explained simply. Learn why LLMs make up facts and how to reduce hallucinations with RAG.',
 'AI hallucination', ARRAY['LLM hallucination','AI makes up facts','hallucination definition AI','why does AI hallucinate'],
 'published', now()),

('Temperature', 'temperature',
 'A parameter that controls the randomness of AI outputs. Low temperature (near 0) = more predictable responses. High temperature (near 1) = more creative, varied responses.',
 NULL,
 'Parameters',
 ARRAY['temperature','randomness','creativity','sampling'],
 ARRAY['large-language-model'],
 'What is Temperature in AI? | AI Glossary',
 'AI temperature parameter explained simply. Learn how temperature controls creativity vs. predictability in LLM outputs.',
 'temperature AI parameter', ARRAY['temperature setting LLM','AI temperature definition','temperature vs top-p'],
 'published', now()),

('Parameters', 'parameters',
 'The numerical values (weights) that define what an AI model has learned. Larger models generally perform better but are more expensive to run.',
 NULL,
 'Models',
 ARRAY['parameters','weights','model size','billions'],
 ARRAY['large-language-model','deep-learning','scaling-law','quantization'],
 'What are AI Model Parameters? | AI Glossary',
 'AI parameters explained simply. Learn what model parameters are and why a 70B parameter model differs from 7B.',
 'AI parameters', ARRAY['model parameters definition','weights AI','parameter count LLM','what are model weights'],
 'published', now()),

('Inference', 'inference',
 'Running a trained AI model to generate predictions or outputs. The "deployment" phase as opposed to the "training" phase.',
 NULL,
 'Infrastructure',
 ARRAY['inference','deployment','runtime','latency'],
 ARRAY['gpu','parameters','quantization'],
 'What is Inference in AI? | AI Glossary',
 'AI inference explained simply. Learn what inference means and how it differs from model training.',
 'AI inference', ARRAY['inference definition AI','model inference','inference vs training'],
 'published', now()),

('GPU (Graphics Processing Unit)', 'gpu',
 'The hardware that powers AI training and inference. Originally designed for graphics, GPUs excel at the parallel math operations that AI requires. NVIDIA is the dominant supplier.',
 NULL,
 'Infrastructure',
 ARRAY['gpu','hardware','nvidia','compute','chips'],
 ARRAY['inference','deep-learning'],
 'What is a GPU and Why Does AI Need It? | AI Glossary',
 'GPU explained in the context of AI. Learn why GPUs are essential for training and running AI models.',
 'GPU AI', ARRAY['GPU definition AI','NVIDIA GPU AI','why AI needs GPU','graphics processing unit'],
 'published', now()),

('Foundation Model', 'foundation-model',
 'A large AI model trained on broad data at scale, designed to be adapted for many downstream tasks. GPT-4, Claude, Gemini, and Llama are foundation models.',
 NULL,
 'Models',
 ARRAY['foundation model','base model','pre-trained','general purpose'],
 ARRAY['large-language-model','pre-training','multimodal-ai'],
 'What is a Foundation Model? | AI Glossary',
 'Foundation model explained simply. Learn what foundation models are and why they are the base of modern AI applications.',
 'foundation model', ARRAY['foundation model definition','base model AI','what is a foundation model'],
 'published', now()),

('Multimodal AI', 'multimodal-ai',
 'An AI system that can process and generate multiple types of data — text, images, audio, video — in a single model.',
 'GPT-4o can analyze an image and answer questions about it in the same conversation.',
 'Models',
 ARRAY['multimodal','vision','audio','images','text'],
 ARRAY['foundation-model','large-language-model'],
 'What is Multimodal AI? | AI Glossary',
 'Multimodal AI explained simply. Learn how models like GPT-4o process text, images, and audio together.',
 'multimodal AI', ARRAY['multimodal model','vision language model','multimodal definition','GPT-4o explained'],
 'published', now()),

('Open Source AI', 'open-source-ai',
 'AI models whose weights, architecture, and/or training code are publicly released, allowing anyone to run, modify, or build on them.',
 'Meta''s Llama models are open source — you can run them on your own hardware.',
 'Ecosystem',
 ARRAY['open source','llama','weights','community'],
 ARRAY['closed-source-ai','hugging-face'],
 'What is Open Source AI? | AI Glossary',
 'Open source AI explained simply. Learn what open source AI means, its benefits, and key models like Llama.',
 'open source AI', ARRAY['open source AI definition','open source LLM','Llama open source','open weights AI'],
 'published', now()),

('Closed Source AI', 'closed-source-ai',
 'AI models where the weights and architecture are kept proprietary, accessible only through an API. GPT-4 and Claude are closed source.',
 NULL,
 'Ecosystem',
 ARRAY['closed source','proprietary','api','gpt-4','claude'],
 ARRAY['open-source-ai'],
 'What is Closed Source AI? | AI Glossary',
 'Closed source AI explained. Learn the difference between open and closed source AI models and why it matters.',
 'closed source AI', ARRAY['closed source AI definition','proprietary AI model','closed AI vs open AI'],
 'published', now()),

('AI Agent', 'ai-agent',
 'An AI system that can autonomously take actions to complete goals — using tools, browsing the web, writing code, and making decisions across multiple steps.',
 'An AI agent that independently researches a topic, writes a report, and emails it to you.',
 'Usage',
 ARRAY['ai agent','autonomous','agentic','tools','multi-step'],
 ARRAY['tool-calling','large-language-model','langchain'],
 'What is an AI Agent? | AI Glossary',
 'AI agents explained simply. Learn what agentic AI is and how AI agents autonomously complete multi-step tasks.',
 'AI agent', ARRAY['AI agent definition','autonomous AI','agentic AI','what is AI agent'],
 'published', now()),

('Tool Calling / Function Calling', 'tool-calling',
 'The ability of an LLM to invoke external tools or APIs — like searching the web, running code, or reading files — as part of generating a response.',
 NULL,
 'Usage',
 ARRAY['tool calling','function calling','api','plugins','actions'],
 ARRAY['ai-agent','large-language-model'],
 'What is Tool Calling in AI? | AI Glossary',
 'Tool calling / function calling explained simply. Learn how LLMs use external tools to access real-time data and take actions.',
 'tool calling AI', ARRAY['function calling LLM','tool use AI','tool calling definition','OpenAI function calling'],
 'published', now()),

('Zero-shot Learning', 'zero-shot-learning',
 'An AI model''s ability to perform a task it has never been explicitly trained on, relying only on general knowledge from pre-training.',
 NULL,
 'Capabilities',
 ARRAY['zero-shot','generalization','transfer learning'],
 ARRAY['few-shot-learning','prompt-engineering'],
 'What is Zero-shot Learning? | AI Glossary',
 'Zero-shot learning explained simply. Learn how AI models solve problems they''ve never seen before.',
 'zero-shot learning', ARRAY['zero-shot definition','zero-shot prompting','what is zero-shot'],
 'published', now()),

('Few-shot Learning', 'few-shot-learning',
 'Showing an AI model a few examples in the prompt to help it understand the pattern and perform a task correctly — without any fine-tuning.',
 'Showing 3 examples of tweet-to-headline conversions before asking GPT to do a new one.',
 'Capabilities',
 ARRAY['few-shot','in-context learning','examples','prompting'],
 ARRAY['zero-shot-learning','prompt-engineering'],
 'What is Few-shot Learning? | AI Glossary',
 'Few-shot learning explained simply. Learn how to give AI examples in the prompt to improve accuracy.',
 'few-shot learning', ARRAY['few-shot prompting','in-context learning','few-shot definition','few-shot examples'],
 'published', now()),

('Chain of Thought (CoT)', 'chain-of-thought',
 'A prompting technique that asks the AI to "think step by step" before giving a final answer, significantly improving performance on complex reasoning tasks.',
 NULL,
 'Usage',
 ARRAY['chain of thought','CoT','reasoning','step by step'],
 ARRAY['prompt-engineering','prompt','few-shot-learning'],
 'What is Chain of Thought (CoT) Prompting? | AI Glossary',
 'Chain of thought prompting explained simply. Learn why "think step by step" dramatically improves AI reasoning.',
 'chain of thought prompting', ARRAY['chain of thought definition','CoT prompting','step by step AI','reasoning prompting'],
 'published', now()),

('System Prompt', 'system-prompt',
 'Instructions given to an LLM at the start of a conversation to define its behavior, persona, or constraints. Users don''t typically see these.',
 NULL,
 'Usage',
 ARRAY['system prompt','instructions','persona','behavior'],
 ARRAY['prompt','prompt-engineering'],
 'What is a System Prompt? | AI Glossary',
 'System prompts explained simply. Learn how system prompts shape AI behavior and create custom AI assistants.',
 'system prompt', ARRAY['system prompt definition','system instruction LLM','what is system prompt'],
 'published', now()),

('Diffusion Model', 'diffusion-model',
 'The AI architecture behind most modern image generators (Stable Diffusion, DALL-E, Midjourney). It learns to reverse a process of adding noise to images.',
 NULL,
 'Architecture',
 ARRAY['diffusion model','image generation','stable diffusion','dall-e','midjourney'],
 ARRAY['deep-learning','gan'],
 'What is a Diffusion Model? | AI Glossary',
 'Diffusion models explained simply. Learn how Stable Diffusion and DALL-E generate images from text.',
 'diffusion model', ARRAY['diffusion model definition','how does Stable Diffusion work','image generation AI','what is diffusion model'],
 'published', now()),

('GAN (Generative Adversarial Network)', 'gan',
 'An older generative AI architecture where two neural networks compete: one generates fake content, the other tries to detect fakes.',
 NULL,
 'Architecture',
 ARRAY['gan','generative adversarial','generator','discriminator'],
 ARRAY['diffusion-model','deep-learning'],
 'What is a GAN (Generative Adversarial Network)? | AI Glossary',
 'GANs explained simply. Learn how generative adversarial networks work and how they compare to diffusion models.',
 'GAN generative adversarial network', ARRAY['GAN definition','generative adversarial network','how GAN works','GAN vs diffusion'],
 'published', now()),

('Quantization', 'quantization',
 'A technique to make AI models smaller and faster by reducing the precision of their numerical weights — enabling powerful models to run on consumer hardware.',
 NULL,
 'Infrastructure',
 ARRAY['quantization','compression','efficiency','gguf','4-bit'],
 ARRAY['inference','parameters'],
 'What is Quantization in AI? | AI Glossary',
 'Quantization explained simply. Learn how quantization makes large AI models run on laptops and phones.',
 'model quantization', ARRAY['quantization definition AI','4-bit quantization','GGUF quantization','how quantization works'],
 'published', now()),

('Distillation', 'distillation',
 'Training a smaller "student" model to mimic a larger "teacher" model''s behavior, transferring knowledge while reducing compute requirements.',
 NULL,
 'Training',
 ARRAY['distillation','knowledge distillation','student model','teacher model','compression'],
 ARRAY['fine-tuning','parameters'],
 'What is Knowledge Distillation in AI? | AI Glossary',
 'Knowledge distillation explained simply. Learn how smaller AI models learn from larger ones through distillation.',
 'knowledge distillation', ARRAY['distillation definition AI','model distillation','knowledge distillation LLM'],
 'published', now()),

('Reinforcement Learning (RL)', 'reinforcement-learning',
 'A type of machine learning where an agent learns by trial and error, receiving rewards for good actions and penalties for bad ones.',
 NULL,
 'Foundations',
 ARRAY['reinforcement learning','rl','reward','policy','agent'],
 ARRAY['rlhf','machine-learning'],
 'What is Reinforcement Learning (RL)? | AI Glossary',
 'Reinforcement learning explained simply. Learn how AI learns through rewards and penalties — and how it relates to ChatGPT.',
 'reinforcement learning', ARRAY['RL definition','reinforcement learning explained','reward learning','what is RL AI'],
 'published', now()),

('Overfitting', 'overfitting',
 'When an AI model learns the training data too well, including its noise and quirks, performing poorly on new, unseen data.',
 NULL,
 'Training',
 ARRAY['overfitting','generalization','training data','regularization'],
 ARRAY['machine-learning','benchmark'],
 'What is Overfitting in Machine Learning? | AI Glossary',
 'Overfitting explained simply. Learn what overfitting is and why it causes AI models to fail in the real world.',
 'overfitting', ARRAY['overfitting definition','overfitting vs underfitting','how to prevent overfitting'],
 'published', now()),

('Benchmark', 'benchmark',
 'A standardized test used to measure and compare AI model performance. Common ones include MMLU (knowledge), HumanEval (coding), and HellaSwag (commonsense reasoning).',
 NULL,
 'Evaluation',
 ARRAY['benchmark','evaluation','mmlu','humaneval','performance'],
 ARRAY['overfitting','bias'],
 'What is an AI Benchmark? | AI Glossary',
 'AI benchmarks explained simply. Learn how MMLU, HumanEval, and other benchmarks compare AI model performance.',
 'AI benchmark', ARRAY['benchmark definition AI','MMLU benchmark','HumanEval','AI model evaluation'],
 'published', now()),

('AI Safety', 'ai-safety',
 'The research field focused on ensuring AI systems behave as intended and remain aligned with human values, especially as they become more powerful.',
 NULL,
 'Ethics & Safety',
 ARRAY['ai safety','alignment','existential risk','safety research'],
 ARRAY['alignment','bias','ai-governance'],
 'What is AI Safety? | AI Glossary',
 'AI safety explained simply. Learn about the research field working to ensure advanced AI remains safe and beneficial.',
 'AI safety', ARRAY['AI safety definition','AI alignment safety','what is AI safety','existential risk AI'],
 'published', now()),

('Alignment', 'alignment',
 'The challenge of ensuring AI systems pursue goals that are actually beneficial to humans — a core focus of AI safety research.',
 NULL,
 'Ethics & Safety',
 ARRAY['alignment','ai safety','values','goals'],
 ARRAY['ai-safety','rlhf'],
 'What is AI Alignment? | AI Glossary',
 'AI alignment explained simply. Learn why ensuring AI pursues human values is one of the hardest problems in the field.',
 'AI alignment', ARRAY['AI alignment definition','alignment problem AI','value alignment'],
 'published', now()),

('Bias', 'bias',
 'Systematic errors in AI outputs caused by biased training data or flawed algorithms — leading to unfair or inaccurate results for certain groups.',
 NULL,
 'Ethics & Safety',
 ARRAY['bias','fairness','ethics','training data','discrimination'],
 ARRAY['ai-safety','benchmark'],
 'What is AI Bias? | AI Glossary',
 'AI bias explained simply. Learn how bias in training data leads to unfair AI outputs and how to detect it.',
 'AI bias', ARRAY['AI bias definition','algorithmic bias','fairness AI','bias in machine learning'],
 'published', now()),

('Emergent Behavior', 'emergent-behavior',
 'Unexpected capabilities that appear in large AI models that were not explicitly trained — like GPT-3 suddenly being able to do arithmetic despite not being trained for it.',
 NULL,
 'Models',
 ARRAY['emergent behavior','emergence','capabilities','scale'],
 ARRAY['scaling-law','large-language-model'],
 'What is Emergent Behavior in AI? | AI Glossary',
 'Emergent behavior in AI explained simply. Learn why large models develop unexpected capabilities that smaller ones lack.',
 'emergent behavior AI', ARRAY['emergence AI definition','emergent capabilities LLM','unexpected AI abilities'],
 'published', now()),

('Scaling Law', 'scaling-law',
 'The empirical observation that AI model performance improves predictably as you scale up model size, training data, and compute.',
 NULL,
 'Research',
 ARRAY['scaling law','compute','data','model size','kaplan'],
 ARRAY['emergent-behavior','parameters','large-language-model'],
 'What are Scaling Laws in AI? | AI Glossary',
 'AI scaling laws explained simply. Learn how model performance predictably improves with more data, compute, and parameters.',
 'scaling laws AI', ARRAY['scaling law definition','Chinchilla scaling law','compute scaling','AI scaling'],
 'published', now()),

('Mixture of Experts (MoE)', 'mixture-of-experts',
 'A model architecture where only a subset of the model''s parameters are activated for any given input, enabling much larger models at the same compute cost. Used in GPT-4 and Mixtral.',
 NULL,
 'Architecture',
 ARRAY['mixture of experts','moe','sparse activation','routing','mixtral'],
 ARRAY['large-language-model','transformer'],
 'What is Mixture of Experts (MoE)? | AI Glossary',
 'Mixture of Experts (MoE) explained simply. Learn how MoE makes large AI models cheaper and faster to run.',
 'mixture of experts MoE', ARRAY['MoE definition','mixture of experts architecture','sparse model','Mixtral explained'],
 'published', now()),

('Tokenizer', 'tokenizer',
 'The component that converts raw text into tokens before feeding it to a language model. Different models use different tokenizers.',
 NULL,
 'Models',
 ARRAY['tokenizer','tokenization','bpe','byte-pair encoding'],
 ARRAY['token','large-language-model'],
 'What is a Tokenizer in AI? | AI Glossary',
 'Tokenizers explained simply. Learn how tokenizers break text into tokens and why different models tokenize differently.',
 'tokenizer AI', ARRAY['tokenizer definition','tokenization LLM','BPE tokenizer','how tokenization works'],
 'published', now()),

('API (Application Programming Interface)', 'api',
 'A way for software applications to communicate with each other. AI APIs allow developers to integrate AI capabilities into their own apps without hosting the model themselves.',
 NULL,
 'Infrastructure',
 ARRAY['api','interface','rest','integration','developer'],
 ARRAY['inference'],
 'What is an API in AI? | AI Glossary',
 'AI APIs explained simply. Learn how APIs let developers integrate AI capabilities into their applications.',
 'AI API', ARRAY['API definition','OpenAI API','what is API','REST API AI'],
 'published', now()),

('Hugging Face', 'hugging-face',
 'The leading platform for sharing and discovering open-source AI models, datasets, and demos. Often called "the GitHub of AI".',
 NULL,
 'Ecosystem',
 ARRAY['hugging face','open source','models','datasets','hub'],
 ARRAY['open-source-ai','langchain'],
 'What is Hugging Face? | AI Glossary',
 'Hugging Face explained simply. Learn about the platform powering open-source AI model sharing.',
 'Hugging Face', ARRAY['Hugging Face definition','Hugging Face Hub','GitHub of AI','what is Hugging Face'],
 'published', now()),

('LangChain', 'langchain',
 'A popular open-source framework for building applications with LLMs — simplifying chaining prompts, connecting to data sources, and building AI agents.',
 NULL,
 'Infrastructure',
 ARRAY['langchain','framework','chains','agents','orchestration'],
 ARRAY['hugging-face','ai-agent','rag'],
 'What is LangChain? | AI Glossary',
 'LangChain explained simply. Learn how LangChain helps developers build LLM-powered applications faster.',
 'LangChain', ARRAY['LangChain definition','LangChain framework','what is LangChain','LangChain tutorial'],
 'published', now()),

('Semantic Search', 'semantic-search',
 'Search that understands the meaning of a query (rather than just matching keywords), using embeddings to find conceptually similar results.',
 NULL,
 'Applications',
 ARRAY['semantic search','meaning','similarity','embeddings','search'],
 ARRAY['embedding','vector-database','rag'],
 'What is Semantic Search? | AI Glossary',
 'Semantic search explained simply. Learn how semantic search finds meaning instead of just matching keywords.',
 'semantic search', ARRAY['semantic search definition','vector search','meaning-based search','semantic vs keyword search'],
 'published', now()),

('AI Governance', 'ai-governance',
 'The policies, regulations, and frameworks used to guide the development, deployment, and oversight of AI systems.',
 NULL,
 'Ethics & Safety',
 ARRAY['ai governance','regulation','policy','oversight','ethics'],
 ARRAY['ai-safety','alignment'],
 'What is AI Governance? | AI Glossary',
 'AI governance explained simply. Learn about the policies and regulations shaping the responsible development of AI.',
 'AI governance', ARRAY['AI governance definition','AI regulation','AI policy','responsible AI'],
 'published', now())

ON CONFLICT (slug) DO NOTHING;

-- ─── 5. UPDATED TIMESTAMP FUNCTION ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_glossary_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS glossary_terms_updated_at ON public.glossary_terms;
CREATE TRIGGER glossary_terms_updated_at
  BEFORE UPDATE ON public.glossary_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_glossary_updated_at();
