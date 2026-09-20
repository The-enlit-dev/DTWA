import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Company } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CompaniesClient from './CompaniesClient';

export const metadata: Metadata = {
  title: 'AI Company Database',
  description:
    'Deep profiles on AI companies — founders, funding, valuations, and the products changing the world.',
  openGraph: {
    title: 'AI Company Database | Decoding Tomorrow With Attharva',
    description: 'Deep profiles on AI companies — founders, funding, valuations, and the products changing the world.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/companies' },
};

export const dynamic = 'force-dynamic';

async function getCompanies() {
  const { data } = await supabase
    .from('companies')
    .select('*')
    .order('view_count', { ascending: false })
    .limit(100);
  return (data || []) as Company[];
}

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display font-bold text-4xl text-white mb-3">AI Company Database</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Deep profiles on the companies building the future — founders, funding, valuations, and the products changing the world.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <CompaniesClient companies={companies} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
