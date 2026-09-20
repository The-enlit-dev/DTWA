import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContactForm from './ContactForm';
import { Mail, Youtube, Twitter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Decoding Tomorrow With Attharva. Story tips, partnerships, and sponsorships.',
  openGraph: {
    title: 'Contact | Decoding Tomorrow With Attharva',
    description: 'Get in touch with Attharva for story tips, partnerships, and sponsorships.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left */}
            <div>
              <h1 className="font-display font-bold text-4xl text-white mb-4">Get in Touch</h1>
              <p className="text-gray-400 leading-relaxed mb-8">
                Have a story tip, partnership idea, or just want to say hi? I&apos;d love to hear from you. Fill out the form and I&apos;ll get back to you within 48 hours.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">Email</div>
                    <div className="text-sm">decodingtomorrowwithattharva@gmail.com</div>
                  </div>
                </div>
                <a
                  href="https://www.youtube.com/@DecodingTomorrowWithAttharva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center">
                    <Youtube className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">YouTube</div>
                    <div className="text-sm">@DecodingTomorrowWithAttharva</div>
                  </div>
                </a>
              </div>

              <div className="glass rounded-xl p-5 border border-white/8">
                <h3 className="font-semibold text-white mb-2">Looking for sponsorships?</h3>
                <p className="text-sm text-gray-500">
                  If you&apos;re an AI company or tool interested in reaching a highly engaged tech audience, please mention it in your message.
                </p>
              </div>
            </div>

            {/* Right */}
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
