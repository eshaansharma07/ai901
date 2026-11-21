import type { EventData } from '@/lib/client';
import { inferEventIntent, words } from '@/lib/event-intent';
import { approximatePoint, eventCity as placeName, kilometers, sameCity, type Point } from '@/lib/event-location';

const filler = new Set(words('a an and are at can find for i in is me near on or please show some the to want with need looking events event this next today tomorrow weekend around anything something what there any summarize summary happening tell about whats where my local nearby help recommend directions route how get go i’d like would could'));

function matchesDate(query: string, startsAt: string, now: Date) {
  const day = new Date(startsAt);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (/\btomorrow\b/i.test(query)) start.setDate(start.getDate() + 1);
  else if (/\bweekend\b/i.test(query)) {
    const weekday = start.getDay();
    start.setDate(start.getDate() + (weekday === 0 ? -1 : 6 - weekday));
    if (/\bnext weekend\b/i.test(query)) start.setDate(start.getDate() + 7);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 2);
    return day >= start && day < end;
  } else if (!/\btoday\b/i.test(query)) return true;
  end.setTime(start.getTime());
  end.setDate(end.getDate() + 1);
  return day >= start && day < end;
}

export function findEvents(events: EventData[], query: string, selectedPlace: string, point?: Point, detectedCity = '') {
  const now = new Date();
  const queryWords = words(query);
  const normalizedQuery = ' ' + queryWords.join(' ') + ' ';
  const inferredPlace = events.map(event => words(placeName(event.location)).join(' '))
    .filter(place => place.length > 2 && normalizedQuery.includes(' ' + place + ' '))
    .sort((first, second) => second.length - first.length)[0];
  const targetPlace = selectedPlace ? words(selectedPlace).join(' ') : inferredPlace;
  const placeWords = new Set(words(targetPlace ?? ''));
  const terms = [...new Set(queryWords.filter(word => !filler.has(word) && !placeWords.has(word)))];
  const category = inferEventIntent(terms.join(' '));
  return events.filter(event => new Date(event.startsAt) > now
      && matchesDate(query, event.startsAt, now)
      && (!targetPlace || words(placeName(event.location)).join(' ') === targetPlace))
    .map(event => {
      const title = words(event.title);
      const location = words(event.location);
      const description = words(event.description + ' ' + event.category);
      const score = terms.reduce((total, term) => total + (title.includes(term) || location.includes(term) ? 4 : description.includes(term) ? 1 : 0), Number(category === event.category));
      const venue = point && approximatePoint(event.location);
      return { event, score, distance: point && venue ? kilometers(point, venue) : detectedCity && sameCity(placeName(event.location), detectedCity) ? 0 : Infinity };
    })
    .filter(({ score }) => !terms.length || score > 0)
    .sort((a, b) => b.score - a.score || a.distance - b.distance || Date.parse(a.event.startsAt) - Date.parse(b.event.startsAt))
    .map(({ event }) => event);
}
