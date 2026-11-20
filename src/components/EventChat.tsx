'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, MessageCircle, Send, X } from 'lucide-react';
import { dateLabel, post, type EventData } from '@/lib/client';
import EventDirections from './EventDirections';

type Message = { id: number; role: 'visitor' | 'assistant'; text: string; events?: EventData[] };
const examples = ['What’s happening nearby?', 'Events this weekend', 'Live music in Bengaluru'];

export default function EventChat({ events, city, networkCity, loading }: {
  events: EventData[]; city: string; networkCity?: string; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const log = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, open, thinking, error]);

  async function ask(question: string) {
    const prompt = question.trim();
    if (!prompt || loading || thinking) return;
    const visitor: Message = { id: nextId.current++, role: 'visitor', text: prompt };
    const history = [...messages, visitor].slice(-9);
    setMessages(history);
    setInput('');
    setError('');
    setThinking(true);
    try {
      const result = await post<{ answer: string; eventIds: string[] }>('/api/ai/chat', {
        messages: history.map(({ role, text }) => ({ role, text })),
        city: city || networkCity || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      const selected = result.eventIds.flatMap(id => {
        const event = events.find(listing => listing._id === id);
        return event ? [event] : [];
      });
      setMessages([...history, { id: nextId.current++, role: 'assistant', text: result.answer, events: selected }]);
    } catch (error) {
      setMessages(messages);
      setInput(prompt);
      setError((error as Error).message);
    } finally {
      setThinking(false);
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); ask(input); }

  return <div className="event-chat">
    {open && <section className="event-chat-panel" aria-label="EventIQ event assistant">
      <header><div><strong>EventIQ Assistant</strong><p>Powered by Gemini · Uses published event listings</p></div><button type="button" aria-label="Close event assistant" onClick={() => setOpen(false)}><X size={21}/></button></header>
      <div ref={log} className="event-chat-log" role="log" aria-label="Conversation">
        {!messages.length && <p className="event-chat-reply">Ask what’s happening nearby, look for a specific kind of event, or ask for directions to a listing.</p>}
        {messages.map(message => <div key={message.id} className={message.role === 'visitor' ? 'event-chat-user' : 'event-chat-reply'}>
          <p>{message.text}</p>
          {!!message.events?.length && <ul>{message.events.map(event => <li key={event._id}>
            <Link href={`/events/${event._id}`}>{event.title} <ArrowUpRight size={13}/></Link>
            <span>{dateLabel(event.startsAt)} · {event.location}</span>
            {event.description && <span>{event.description.replace(/^Sample event for exploring EventIQ AI\. This listing is fictional and has no real-world venue or attendance\.\s*/i, '').slice(0, 120)}</span>}
            <EventDirections event={event}/>
          </li>)}</ul>}
        </div>)}
        {thinking && <p className="event-chat-reply" role="status">Gemini is thinking…</p>}
        {error && <p className="event-chat-reply" role="alert">{error}</p>}
      </div>
      {!messages.length && <div className="event-chat-examples">{examples.map(example => <button key={example} type="button" disabled={loading || thinking} onClick={() => ask(example)}>{example}</button>)}</div>}
      <form onSubmit={submit}><label className="sr-only" htmlFor="event-chat-input">Ask EventIQ</label><input id="event-chat-input" maxLength={800} value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about events…"/><button type="submit" disabled={!input.trim() || loading || thinking} aria-label="Send message"><Send size={18}/></button></form>
    </section>}
    {!open && <button className="event-chat-launch" type="button" onClick={() => setOpen(true)}><MessageCircle size={19}/> Ask EventIQ</button>}
  </div>;
}
