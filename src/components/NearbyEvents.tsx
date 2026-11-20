'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, LocateFixed, MapPin } from 'lucide-react';
import { api, dateLabel, type EventData } from '@/lib/client';

import { approximatePoint, eventCity, kilometers } from '@/lib/event-location';
import { useEventLocation } from '@/lib/use-event-location';
import EventChat from '@/components/EventChat';

export default function NearbyEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const { location, locationState, locate, clearLocation } = useEventLocation();
  const point = location?.point;
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const rail = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let saved = '';
    try { saved = localStorage.getItem('eventiq-city') ?? ''; } catch {}
    if (saved) setCity(saved);
    else void locate();
    const request = new AbortController();
    api<EventData[]>('/api/events?upcoming=1', { signal: request.signal })
      .then(result => { setEvents(result); setStatus('ready'); })
      .catch(() => { if (!request.signal.aborted) setStatus('error'); });
    return () => request.abort();
  }, []);

  function chooseCity(value: string) {
    clearLocation();
    setCity(value);
    try {
      if (value) localStorage.setItem('eventiq-city', value);
      else localStorage.removeItem('eventiq-city');
    } catch {}
  }

  async function useLocation() {
    if (await locate()) {
      setCity('');
      try { localStorage.removeItem('eventiq-city'); } catch {}
    }
  }

  const citiesWithEvents = [...new Set(events.map(event => eventCity(event.location)))].filter(Boolean).sort();
  const ranked = point ? events.flatMap(event => {
    const city = approximatePoint(event.location);
    if (!city) return [];
    const distance = kilometers(point, city);
    return [{ event, distance }];
  }).sort((a, b) => a.distance - b.distance || Date.parse(a.event.startsAt) - Date.parse(b.event.startsAt)) : [];
  const nearby = ranked.filter(({ distance }) => distance <= 100);
  const cityEvents = city ? events.filter(event => eventCity(event.location) === city) : events;
  const listings = !city && ranked.length ? (nearby.length ? nearby : ranked) : cityEvents.map(event => ({ event, distance: null }));
  const title = city ? 'Events in ' + city : nearby.length ? 'Events near you' : ranked.length ? 'Nearest upcoming events' : 'Upcoming events';
  const origin = location?.source === 'network'
    ? (location.city ? 'Approximate location: ' + location.city + '. ' : 'Using your approximate network location. ')
    : 'Using your device location. ';
  const locationMessage = locationState === 'checking' ? 'Checking your location…'
    : locationState === 'unavailable' ? 'Location couldn’t be detected. Choose a city to filter the events.'
    : city ? 'Showing upcoming events in your selected city.'
    : nearby.length ? origin + 'Distances are approximate and based on the event city.'
    : ranked.length ? origin + 'No listed events within 100 km. Showing the closest listings with known locations.'
    : location ? origin + 'Distances are unavailable for these listings.'
    : 'Find events near you or choose a city.';

  function slide(direction: number) {
    const list = rail.current;
    const first = list?.firstElementChild;
    if (list && first) list.scrollBy({ left: (first.getBoundingClientRect().width + 16) * direction });
  }

  return <section className="nearby-section launch-wrap" aria-labelledby="nearby-heading">
    <header className="nearby-header">
      <div>
        <span className="ai-label"><LocateFixed size={17}/> Event discovery</span>
        <h2 id="nearby-heading">{title}</h2>
        <p aria-live="polite">{locationMessage}</p>
      </div>
      <Link href="/events" className="launch-primary">See all events <ArrowUpRight size={17}/></Link>
    </header>
    <div className="nearby-location-tools">
      <label htmlFor="nearby-city">City</label>
      <select id="nearby-city" value={city} onChange={event => chooseCity(event.target.value)}>
        <option value="">All cities</option>
        {city && !citiesWithEvents.includes(city) && <option value={city}>{city}</option>}
        {citiesWithEvents.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
      <button className="nearby-location" type="button" onClick={useLocation} disabled={locationState === 'checking'}><LocateFixed size={15}/> {locationState === 'checking' ? 'Locating…' : 'Use my location'}</button>
    </div>
    {status === 'loading' ? <p className="nearby-status" role="status">Loading events…</p> :
      status === 'error' ? <p className="nearby-status" role="status">Events are temporarily unavailable.</p> :
      !listings.length ? <p className="nearby-status">{city ? 'No upcoming events in this city. Choose another city or view all events.' : 'New events will appear here when published.'}</p> :
      <>
        <ul ref={rail} id="nearby-event-list" className="nearby-rail" aria-label={title}>
          {listings.slice(0, 12).map(({ event, distance }) => <li key={event._id}>
            <Link className="nearby-card" href={`/events/${event._id}`}>
              <div className="nearby-card-top"><span>{event.category}</span><ArrowUpRight size={19}/></div>
              <h3>{event.title}</h3>
              <p><CalendarDays size={15}/>{dateLabel(event.startsAt)}</p>
              <p><MapPin size={15}/>{event.location}{distance === null ? '' : ` · ~${Math.round(distance)} km`}</p>
            </Link>
          </li>)}
        </ul>
        {listings.length > 1 && <div className="nearby-controls">
          <button type="button" onClick={() => slide(-1)} aria-label="Previous events" aria-controls="nearby-event-list"><ArrowLeft size={19}/></button>
          <button type="button" onClick={() => slide(1)} aria-label="Next events" aria-controls="nearby-event-list"><ArrowRight size={19}/></button>
        </div>}
      </>}
    <EventChat events={events} city={city} networkCity={location?.city} loading={status === 'loading'}/>
  </section>;
}
