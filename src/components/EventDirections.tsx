import { Navigation } from 'lucide-react';
import type { EventData } from '@/lib/client';
import { eventCity } from '@/lib/event-location';

export default function EventDirections({ event }: { event: Pick<EventData, 'location' | 'title'> }) {
  if (/\b(?:online|virtual|remote)\b/i.test(event.location)) return null;
  const demo = /^demo · /i.test(event.title);
  const destination = encodeURIComponent(demo ? eventCity(event.location) : event.location);
  const url = demo
    ? 'https://www.google.com/maps/search/?api=1&query=' + destination
    : 'https://www.google.com/maps/dir/?api=1&destination=' + destination;
  return <a className="btn-light event-directions" href={url} target="_blank" rel="noopener noreferrer"><Navigation size={15}/>{demo ? 'View demo city' : 'Directions'}</a>;
}
