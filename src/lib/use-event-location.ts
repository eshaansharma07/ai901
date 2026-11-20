'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';
import type { Point } from '@/lib/event-location';

type Location = { point: Point; source: 'device' | 'network'; city?: string };

async function granted() {
  try {
    return !!navigator.geolocation && (await navigator.permissions?.query({ name: 'geolocation' }))?.state === 'granted';
  } catch {
    return false;
  }
}

function devicePoint(signal: AbortSignal) {
  return new Promise<Point | null>(resolve => {
    const timer = setTimeout(() => finish(null), 3000);
    function finish(point: Point | null) {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      resolve(point);
    }
    function abort() { finish(null); }
    signal.addEventListener('abort', abort, { once: true });
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => finish([coords.latitude, coords.longitude]),
        () => finish(null),
        { enableHighAccuracy: false, timeout: 2700, maximumAge: 300000 },
      );
    } catch { finish(null); }
  });
}

export function useEventLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationState, setLocationState] = useState<'idle' | 'checking' | 'known' | 'unavailable'>('idle');
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, []);

  function clearLocation() {
    request.current?.abort();
    request.current = null;
    setLocation(null);
    setLocationState('idle');
  }

  async function locate() {
    if (request.current) return false;
    const controller = new AbortController();
    request.current = controller;
    const { signal } = controller;
    setLocationState('checking');
    setLocation(null);
    try {
      const permission = await Promise.race([granted(), new Promise<false>(resolve => setTimeout(() => resolve(false), 400))]);
      const precise = permission && !signal.aborted ? await devicePoint(signal) : null;
      let result: Location | null = precise ? { point: precise, source: 'device' } : null;
      if (!result && !signal.aborted) {
        const approximate = await api<{ point: Point; city: string } | null>('/api/location', {
          signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]),
        });
        if (approximate) result = { ...approximate, source: 'network' };
      }
      if (signal.aborted) return false;
      setLocation(result);
      setLocationState(result ? 'known' : 'unavailable');
      return !!result;
    } catch {
      if (!signal.aborted) setLocationState('unavailable');
      return false;
    } finally {
      if (request.current === controller) request.current = null;
    }
  }

  return { location, locationState, locate, clearLocation };
}
