'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function getDeviceType(): string {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'dt_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function VisitorTracker() {
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const page = window.location.pathname;
    const referrer = document.referrer || '';
    const deviceType = getDeviceType();

    // Upsert session and record page view
    Promise.all([
      supabase.rpc('upsert_visitor_session', {
        p_session_id: sessionId,
        p_page: page,
        p_referrer: referrer,
        p_device_type: deviceType,
      }),
      supabase.rpc('record_page_view', {
        p_session_id: sessionId,
        p_page: page,
        p_referrer: referrer,
        p_device_type: deviceType,
      }),
    ]).then(() => {});

    // Update last_active on page hide/unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        supabase.rpc('upsert_visitor_session', {
          p_session_id: sessionId,
          p_page: page,
          p_referrer: referrer,
          p_device_type: deviceType,
        }).then(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return null;
}
