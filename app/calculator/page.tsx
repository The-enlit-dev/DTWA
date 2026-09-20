import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CalculatorClient from './CalculatorClient';

export const metadata: Metadata = {
  title: 'AI Cost Calculator — Estimate Your AI Tool Budget',
  description:
    'Calculate exactly how much AI tools will cost your team. Compare ChatGPT, Claude, Gemini, Midjourney, and more — with USD and INR pricing.',
  keywords: ['AI cost calculator', 'ChatGPT pricing', 'Claude pricing', 'AI tools budget', 'AI tools cost India'],
  openGraph: {
    title: 'AI Cost Calculator | Decoding Tomorrow With Attharva',
    description: 'Estimate your monthly AI tool spend in seconds.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/calculator' },
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <CalculatorClient />
      </main>
      <Footer />
    </div>
  );
}
