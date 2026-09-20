import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PromptGeneratorClient from './PromptGeneratorClient';

export const metadata: Metadata = {
  title: 'Free AI Prompt Generator — Build Better AI Prompts Instantly',
  description: 'Generate high-quality AI prompts for writing, coding, research, emails, and more. Free tool by Decoding Tomorrow. Copy and use with ChatGPT, Claude, or Gemini.',
  keywords: ['AI prompt generator', 'ChatGPT prompts', 'prompt engineering tool', 'free AI prompts', 'better AI prompts'],
  openGraph: {
    title: 'Free AI Prompt Generator | Decoding Tomorrow',
    description: 'Build better AI prompts instantly. Free tool for writers, coders, researchers, and business professionals.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/prompt-generator' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AI Prompt Generator',
  description: 'Free tool to generate high-quality AI prompts for ChatGPT, Claude, and Gemini.',
  url: 'https://decodingtomorrowwithattharva.netlify.app/prompt-generator',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PromptGeneratorPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <PromptGeneratorClient />
      </main>
      <Footer />
    </div>
  );
}
