'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, force_password_change')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.force_password_change) {
          router.push('/auth/change-password');
          return;
        }
        if (profile?.role && ['admin', 'super_admin', 'editor'].includes(profile.role)) {
          router.push('/admin');
          return;
        }
        router.push('/');
        return;
      }
      router.push('/auth/login');
    };
    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
        <p className="text-gray-500 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
}
