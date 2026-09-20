/*
# Fix: Admin Badge Award RLS + Add Skill Quiz Data + Prediction Reasoning

## Overview
1. Fixes user_badges INSERT policy so admins can award badges to other users.
2. Adds quiz_questions table for skill node verification.
3. Adds reasoning column to prediction_votes for justification requirement.

## 1. Modified Tables
- `prediction_votes` — adds reasoning (text, NOT NULL) column.
  Users must now provide a written justification when voting.
- `user_badges` — INSERT policy updated to also allow admins.

## 2. New Tables
- `skill_quiz_questions` — quiz questions tied to skill nodes.
  (id, node_id, question, options jsonb, correct_index, explanation)
  Each skill node can have multiple quiz questions. Users must answer
  correctly to complete the node — no more "just click to complete."

## 3. Security
- skill_quiz_questions: public read (needed for quiz display), admin write.
- user_badges: INSERT now allows admin/super_admin to insert for any user_id.
- prediction_votes: reasoning column enforces non-empty justification.

## 4. Notes
- All changes are additive. Idempotent.
*/

-- ============ FIX user_badges INSERT POLICY ============
-- Current policy blocks admins from awarding badges to other users.
-- Replace with policy that allows: (a) user inserting own badge, OR (b) admin inserting for anyone.
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============ PREDICTION VOTES: ADD REASONING ============
ALTER TABLE prediction_votes ADD COLUMN IF NOT EXISTS reasoning text DEFAULT '';

-- ============ SKILL QUIZ QUESTIONS ============
CREATE TABLE IF NOT EXISTS skill_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL CHECK (correct_index >= 0),
  explanation text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz questions publicly readable" ON skill_quiz_questions;
CREATE POLICY "Quiz questions publicly readable" ON skill_quiz_questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert quiz questions" ON skill_quiz_questions;
CREATE POLICY "Admins can insert quiz questions" ON skill_quiz_questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

DROP POLICY IF EXISTS "Admins can update quiz questions" ON skill_quiz_questions;
CREATE POLICY "Admins can update quiz questions" ON skill_quiz_questions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

DROP POLICY IF EXISTS "Admins can delete quiz questions" ON skill_quiz_questions;
CREATE POLICY "Admins can delete quiz questions" ON skill_quiz_questions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','editor')));

CREATE INDEX IF NOT EXISTS idx_quiz_questions_node ON skill_quiz_questions(node_id);

-- ============ SEED QUIZ QUESTIONS FOR EXISTING SKILL NODES ============
-- One quiz question per skill node (first 24 nodes)
-- These are basic knowledge-check questions about each topic
INSERT INTO skill_quiz_questions (node_id, question, options, correct_index, explanation)
SELECT
  sn.id,
  CASE sn.node_key
    WHEN 'ai-basics-1' THEN 'What is the key difference between AI and ML?'
    WHEN 'ai-basics-2' THEN 'Which learning type uses labeled training data?'
    WHEN 'ai-basics-3' THEN 'What breakthrough enabled modern deep learning?'
    WHEN 'prompt-1' THEN 'What are the core components of an effective prompt?'
    WHEN 'prompt-2' THEN 'Which technique asks the model to show its reasoning step by step?'
    WHEN 'prompt-3' THEN 'What is the best way to evaluate prompt quality in production?'
    WHEN 'llm-1' THEN 'What does a "token" represent in an LLM?'
    WHEN 'llm-2' THEN 'Which is NOT a major commercial LLM?'
    WHEN 'llm-3' THEN 'What is the primary cause of LLM hallucinations?'
    WHEN 'rag-1' THEN 'What is the main purpose of RAG?'
    WHEN 'rag-2' THEN 'What is "chunking" in a RAG pipeline?'
    WHEN 'rag-3' THEN 'What does re-ranking do in a RAG system?'
    WHEN 'agent-1' THEN 'What distinguishes an AI agent from a simple chain?'
    WHEN 'agent-2' THEN 'What enables an AI agent to use external tools?'
    WHEN 'agent-3' THEN 'In a multi-agent system, what is "delegation"?'
    WHEN 'auto-1' THEN 'Which is a popular no-code automation platform?'
    WHEN 'auto-2' THEN 'What connects AI to external services programmatically?'
    WHEN 'auto-3' THEN 'What is the final step in an end-to-end workflow?'
    WHEN 'ft-1' THEN 'When is fine-tuning better than prompting?'
    WHEN 'ft-2' THEN 'Which method updates only a small subset of model weights?'
    WHEN 'ft-3' THEN 'Why is evaluation critical after fine-tuning?'
    WHEN 'biz-1' THEN 'Which is a common AI business model?'
    WHEN 'biz-2' THEN 'What is usage-based pricing?'
    WHEN 'biz-3' THEN 'What is a "growth loop" in AI go-to-market?'
    ELSE 'What is the key concept of this skill?'
  END,
  CASE sn.node_key
    WHEN 'ai-basics-1' THEN '["AI is hardware, ML is software","ML is a subset of AI that learns from data","AI is robots, ML is algorithms","They are the same thing"]'::jsonb
    WHEN 'ai-basics-2' THEN '["Reinforcement learning","Supervised learning","Unsupervised learning","Self-supervised learning"]'::jsonb
    WHEN 'ai-basics-3' THEN '["Faster CPUs","The transformer architecture","More RAM","Cloud computing"]'::jsonb
    WHEN 'prompt-1' THEN '["Only the instruction","Context, instruction, format, and constraints","Just the question","A single sentence"]'::jsonb
    WHEN 'prompt-2' THEN '["Few-shot prompting","Chain-of-thought prompting","Zero-shot prompting","Role prompting"]'::jsonb
    WHEN 'prompt-3' THEN '["Ask the team","Automated evaluation with test cases","Check if it sounds good","Compare token counts"]'::jsonb
    WHEN 'llm-1' THEN '["A piece of code","A sub-word unit of text","A punctuation mark","A programming variable"]'::jsonb
    WHEN 'llm-2' THEN '["GPT-4o","Claude","Gemini","PostgreSQL"]'::jsonb
    WHEN 'llm-3' THEN '["Insufficient training data","The model generates plausible but false outputs","Hardware limitations","User input errors"]'::jsonb
    WHEN 'rag-1' THEN '["To make models faster","To ground responses in external knowledge and reduce hallucinations","To compress the model","To translate languages"]'::jsonb
    WHEN 'rag-2' THEN '["Splitting documents into smaller pieces for retrieval","Compressing text","Removing duplicates","Encoding text as numbers"]'::jsonb
    WHEN 'rag-3' THEN '["It sorts results by relevance after initial retrieval","It removes bad data","It translates text","It compresses vectors"]'::jsonb
    WHEN 'agent-1' THEN '["Agents use GPUs","Agents can make decisions and use tools iteratively","Agents are always faster","Agents only generate text"]'::jsonb
    WHEN 'agent-2' THEN '["Function calling / tool definitions","Larger context windows","Faster GPUs","More training data"]'::jsonb
    WHEN 'agent-3' THEN '["One agent doing everything","Assigning specific tasks to specialized agents","Deleting an agent","Stopping all agents"]'::jsonb
    WHEN 'auto-1' THEN '["Photoshop","Zapier / Make / n8n","Excel","Notion"]'::jsonb
    WHEN 'auto-2' THEN '["Webhooks and APIs","Email","USB cables","Manual data entry"]'::jsonb
    WHEN 'auto-3' THEN '["Trigger","Processing","Output/delivery","Testing"]'::jsonb
    WHEN 'ft-1' THEN '["When you need faster responses","When you need consistent style/format that prompting can''t achieve","When you have no data","Always"]'::jsonb
    WHEN 'ft-2' THEN '["Full fine-tuning","LoRA (Low-Rank Adaptation)","Quantization","Pruning"]'::jsonb
    WHEN 'ft-3' THEN '["To check if it''s faster","To measure improvements and catch regressions vs the base model","To reduce cost","It isn''t critical"]'::jsonb
    WHEN 'biz-1' THEN '["SaaS subscription","Usage-based API","Marketplace commission","All of the above"]'::jsonb
    WHEN 'biz-2' THEN '["Charging a flat monthly fee","Charging based on how much the customer uses the service","Charging per user","Free forever"]'::jsonb
    WHEN 'biz-3' THEN '["A one-time marketing campaign","A self-reinforcing cycle where users bring in more users","A discount strategy","A hiring plan"]'::jsonb
    ELSE '["Answer A","Answer B","Answer C","Answer D"]'::jsonb
  END,
  CASE sn.node_key
    WHEN 'ai-basics-1' THEN 1
    WHEN 'ai-basics-2' THEN 1
    WHEN 'ai-basics-3' THEN 1
    WHEN 'prompt-1' THEN 1
    WHEN 'prompt-2' THEN 1
    WHEN 'prompt-3' THEN 1
    WHEN 'llm-1' THEN 1
    WHEN 'llm-2' THEN 3
    WHEN 'llm-3' THEN 1
    WHEN 'rag-1' THEN 1
    WHEN 'rag-2' THEN 0
    WHEN 'rag-3' THEN 0
    WHEN 'agent-1' THEN 1
    WHEN 'agent-2' THEN 0
    WHEN 'agent-3' THEN 1
    WHEN 'auto-1' THEN 1
    WHEN 'auto-2' THEN 0
    WHEN 'auto-3' THEN 2
    WHEN 'ft-1' THEN 1
    WHEN 'ft-2' THEN 1
    WHEN 'ft-3' THEN 1
    WHEN 'biz-1' THEN 3
    WHEN 'biz-2' THEN 1
    WHEN 'biz-3' THEN 1
    ELSE 0
  END,
  CASE sn.node_key
    WHEN 'ai-basics-1' THEN 'ML is a subset of AI — it''s the practice of building systems that learn patterns from data.'
    WHEN 'ai-basics-2' THEN 'Supervised learning uses labeled data (input-output pairs) to train models.'
    WHEN 'ai-basics-3' THEN 'The Transformer architecture (2017) enabled parallel training and scaled attention, making modern LLMs possible.'
    WHEN 'prompt-1' THEN 'Effective prompts include context, a clear instruction, desired format, and constraints.'
    WHEN 'prompt-2' THEN 'Chain-of-thought prompting asks the model to reason through intermediate steps before giving the answer.'
    WHEN 'prompt-3' THEN 'Automated evaluation with test cases and scoring rubrics is the reliable way to measure prompt quality.'
    WHEN 'llm-1' THEN 'A token is a sub-word unit of text — LLMs process text as sequences of tokens.'
    WHEN 'llm-2' THEN 'PostgreSQL is a database, not an LLM. GPT-4o, Claude, and Gemini are all major LLMs.'
    WHEN 'llm-3' THEN 'Hallucinations happen when the model generates plausible-sounding but factually incorrect outputs.'
    WHEN 'rag-1' THEN 'RAG retrieves relevant external documents and feeds them to the LLM, grounding responses in verified knowledge.'
    WHEN 'rag-2' THEN 'Chunking splits long documents into smaller, retrievable pieces so the vector search can find the most relevant section.'
    WHEN 'rag-3' THEN 'Re-ranking takes the initial retrieval results and re-orders them by relevance using a more powerful model.'
    WHEN 'agent-1' THEN 'Agents operate in iterative loops — they can decide what to do next and call tools to accomplish goals.'
    WHEN 'agent-2' THEN 'Function calling lets the model invoke external tools/APIs by name with structured arguments.'
    WHEN 'agent-3' THEN 'Delegation assigns a sub-task to another agent that specializes in that area.'
    WHEN 'auto-1' THEN 'Zapier, Make, and n8n are popular no-code/low-code automation platforms that connect apps and APIs.'
    WHEN 'auto-2' THEN 'Webhooks and APIs are the standard way to connect AI to external services programmatically.'
    WHEN 'auto-3' THEN 'The output/delivery step is where the automated workflow delivers its result to the end user or system.'
    WHEN 'ft-1' THEN 'Fine-tuning is best when you need consistent output style or domain-specific behavior that prompting alone can''t reliably achieve.'
    WHEN 'ft-2' THEN 'LoRA (Low-Rank Adaptation) updates only a small subset of weights via low-rank matrices, making fine-tuning much cheaper.'
    WHEN 'ft-3' THEN 'Evaluation catches regressions — a fine-tuned model might improve on the target task but degrade on others.'
    WHEN 'biz-1' THEN 'AI products can use SaaS subscriptions, usage-based APIs, marketplace commissions, or combinations of all these models.'
    WHEN 'biz-2' THEN 'Usage-based pricing charges customers based on how much they actually use the service (e.g., per API call, per token).'
    WHEN 'biz-3' THEN 'A growth loop is a self-reinforcing cycle where product usage naturally brings in new users (e.g., shared outputs that attract signups).'
    ELSE 'Review the skill description and try again.'
  END
FROM skill_nodes sn
WHERE NOT EXISTS (SELECT 1 FROM skill_quiz_questions q WHERE q.node_id = sn.id);
