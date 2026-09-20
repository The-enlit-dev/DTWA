import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import GlossaryClient from './GlossaryClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'AI Glossary — Every AI Term Explained Simply',
  description:
    'The definitive AI glossary. Understand terms like LLM, transformer, RAG, embeddings, and 80+ more concepts — explained in plain language.',
  keywords: ['AI glossary', 'AI terms explained', 'machine learning glossary', 'LLM meaning', 'transformer explained'],
  openGraph: {
    title: 'AI Glossary | Decoding Tomorrow With Attharva',
    description: 'The definitive glossary for AI, machine learning, and deep tech — explained simply.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/glossary' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'AI Glossary — Decoding Tomorrow',
  description: 'A comprehensive glossary of AI, machine learning, and deep tech terms explained in plain language.',
  url: 'https://decodingtomorrowwithattharva.netlify.app/glossary',
};

export default async function GlossaryPage() {
  const { data: terms } = await supabase
    .from('glossary_terms')
    .select('id, term, slug, simple_explanation, example, category, tags')
    .eq('status', 'published')
    .order('term', { ascending: true });

  const categories = Array.from(new Set((terms || []).map((t: any) => t.category))).sort() as string[];

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <GlossaryClient terms={terms || []} categories={categories} />
      </main>
      <Footer />
    </div>
  );
}

