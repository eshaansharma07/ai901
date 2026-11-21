'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';
import type { Point } from '@/lib/event-location';

type Location =
  | { source: 'device'; point: Point; accuracy: number; city?: undefined }
  | { source: 'network'; point?: Point; city: string };

async function granted() {
  try {
    return !!navigator.geolocation && (await navigator.permissions?.query({ name: 'geolocation' }))?.state === 'granted';
  } catch {
    return false;
  }
}

function devicePoint(signal: AbortSignal) {
  return new Promise<Extract<Location, { source: 'device' }> | null>(resolve => {
    const timer = setTimeout(() => finish(null), 10000);
    function finish(point: Extract<Location, { source: 'device' }> | null) {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      resolve(point);
    }
    function abort() { finish(null); }
    signal.addEventListener('abort', abort, { once: true });
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => finish({ point: [coords.latitude, coords.longitude], accuracy: coords.accuracy, source: 'device' }),
        () => finish(null),
        { enableHighAccuracy: true, timeout: 9500, maximumAge: 0 },
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

  async function locate(requestDevice = false) {
    if (request.current) return false;
    const controller = new AbortController();
    request.current = controller;
    const { signal } = controller;
    setLocationState('checking');
    try {
      const permission = requestDevice || await Promise.race([granted(), new Promise<false>(resolve => setTimeout(() => resolve(false), 400))]);
      let result: Location | null = permission && navigator.geolocation && !signal.aborted ? await devicePoint(signal) : null;
      if (!result && !signal.aborted) {
        const approximate = await api<{ point: Point | null; city: string } | null>('/api/location', {
          signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]),
        });
        if (approximate) result = { city: approximate.city, point: approximate.point ?? undefined, source: 'network' };
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
