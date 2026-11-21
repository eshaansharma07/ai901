'use client';

import EventIQBrand from '@/components/EventIQBrand';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, MapPin, Sparkles, LocateFixed } from 'lucide-react';
import { api, dateLabel, type EventData } from '@/lib/client';
import { cityOptions, eventCity } from '@/lib/event-location';
import { findEvents } from '@/lib/event-search';
import EventChat from '@/components/EventChat';
import EventDirections from '@/components/EventDirections';
import { useEventLocation } from '@/lib/use-event-location';

const suggestions = ['Beginner pottery workshops', 'Tech meetups', 'Live music this weekend'];

export default function Events() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const { location, locationState, locate, clearLocation } = useEventLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initial = (new URLSearchParams(window.location.search).get('q') ?? '').slice(0, 180).trim();
    setSearch(initial);
    setQuery(initial);
    let saved = '';
    try { saved = localStorage.getItem('eventiq-city') ?? ''; } catch {}
    if (saved) setSelectedPlace(eventCity(saved));
    else void locate();
    api<EventData[]>('/api/events?upcoming=1').then(setEvents).catch(error => setError(error.message)).finally(() => setLoading(false));
  }, []);

  const places = cityOptions(events.map(event => event.location));
  const upcoming = findEvents(events, query, selectedPlace, location?.point, location?.city);

  return <main className="content public-flow">
    <div className="toprow"><EventIQBrand /><Link href="/dashboard" className="btn-light">Host an event</Link></div>
    <section className="finder-hero" aria-labelledby="finder-title">
      <span className="ai-label"><Sparkles size={16}/> EventIQ AI Finder</span>
      <h1 className="headline" id="finder-title">Find your kind of event.</h1>
      <p className="muted">Describe what you’re in the mood for. The finder matches interests, keywords, and simple timings like “this weekend” against upcoming events.</p>
      <form className="finder-form" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); }}>
        <label className="sr-only" htmlFor="event-description">What are you looking for?</label>
        <input id="event-description" value={search} maxLength={180} onChange={event => setSearch(event.target.value)} placeholder="Try live music this weekend"/>
        <button type="submit" className="btn">Find events <ArrowRight size={17}/></button>
      </form>
      <div className="finder-examples">{suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => { setSearch(suggestion); setQuery(suggestion); }}>{suggestion}</button>)}</div>
    </section>
    <div className="toprow finder-results">
      <h2>{query ? 'Matches for “' + query + '”' : 'Upcoming events'}</h2>
      <div className="finder-filters">
        <label htmlFor="finder-place" className="sr-only">Filter by location</label>
        <select id="finder-place" value={selectedPlace} onChange={event => { clearLocation(); setSelectedPlace(event.target.value); try { if (event.target.value) localStorage.setItem('eventiq-city', event.target.value); else localStorage.removeItem('eventiq-city'); } catch {} }}>
          <option value="">All locations</option>
          {selectedPlace && !places.includes(selectedPlace) && <option>{selectedPlace}</option>}
          {places.map(place => <option key={place}>{place}</option>)}
        </select>
        <button className="btn-light" onClick={async () => { if (await locate(true)) { setSelectedPlace(''); try { localStorage.removeItem('eventiq-city'); } catch {} } }} disabled={locationState === 'checking'}><LocateFixed size={16}/> {locationState === 'checking' ? 'Locating…' : 'Use my location'}</button>
        {(query || selectedPlace || location) && <button className="btn-light" onClick={() => { setSearch(''); setQuery(''); setSelectedPlace(''); clearLocation(); try { localStorage.removeItem('eventiq-city'); } catch {} }}>Clear filters</button>}
      </div>
    </div>
    <div aria-live="polite">
      {locationState === 'unavailable' && <p className="muted tiny">Location couldn’t be detected. Choose a city to filter the events.</p>}
      {location && <p className="muted tiny finder-location-note">{location.source === 'network' ? 'Approximate location' + (location.city ? ': ' + location.city : '') + '.' : 'Device location (accuracy ~' + Math.ceil(location.accuracy) + ' m).'} Events with similar relevance are ordered by distance where available.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p>Loading events…</p>}
      {!loading && !error && !upcoming.length && <div className="card empty">
        {query || selectedPlace ? <><h3>No matching upcoming events</h3><p className="muted">Try a broader search or clear the search to browse everything.</p></> : <><h3>No upcoming public events</h3><p className="muted">New events will appear here once organizers publish them.</p></>}
      </div>}
    </div>
    <div className="eventgrid">{upcoming.map(event => <article className="card" key={event._id}>
      <div className="banner"><CalendarDays size={44}/></div>
      <span className="tag" style={{marginTop:16}}>{event.category}</span>
      <h3 className="event-title">{event.title}</h3>
      <p className="muted tiny">{event.description.slice(0, 140)}</p>
      <div className="meta"><Clock3 size={15}/>{dateLabel(event.startsAt)}</div>
      <div className="meta"><MapPin size={15}/>{event.location}</div>
      <p className="muted tiny" style={{margin:'12px 0'}}>{event.registrationCount}/{event.capacity} seats taken</p>
      <div className="links"><Link className="btn" href={`/events/${event._id}`}>View & register <ArrowRight size={16}/></Link><EventDirections event={event}/></div>
    </article>)}</div>
    <EventChat events={events} city={selectedPlace} networkCity={location?.city} loading={loading}/>
  </main>;
}
