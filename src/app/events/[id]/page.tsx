'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { CalendarDays, MapPin, Users, Clock3, Copy, CheckCircle2, Printer } from 'lucide-react';
import { api, post, dateLabel, type EventData } from '@/lib/client';
import EventDirections from '@/components/EventDirections';
import type { TicketEmailStatus } from '@/lib/ticket-email';

type Registration = { ticket: string; name: string; emailStatus?: TicketEmailStatus };

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [qr, setQr] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => { api<EventData>(`/api/events/${id}`).then(setEvent).catch(error => setError(error.message)); }, [id]);

  async function register(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await post<Registration>(`/api/events/${id}/register`, { name, email });
      setRegistration(result);
      QRCode.toDataURL(result.ticket, { width: 300, margin: 3 }).then(setQr).catch(() => {});
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyTicket(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage('Ticket code copied.');
    } catch {
      setCopyMessage('Select the ticket code to copy it.');
    }
  }

  const demo = /^demo · /i.test(event?.title ?? '');
  const full = !!event && event.registrationCount >= event.capacity;
  const started = !!event && new Date(event.startsAt) <= new Date();

  return <main className="content public-flow ticket-page">
    <div className="toprow ticket-page-nav"><Link href="/" className="brand" style={{ margin: 0 }}>EventIQ AI</Link><Link href="/events" className="btn-light">← All events</Link></div>
    <div className="center" style={{ maxWidth: 750 }}>
      {!event ? <div className="card">{error || 'Loading event…'}</div> : registration ?
        <>
          <div className="ticket-confirmation" role="status"><CheckCircle2 size={22}/><div><strong>You’re registered</strong><p>{registration.emailStatus === 'sent' ? `Confirmation email sent to ${email}.` : registration.emailStatus === 'demo' ? 'Your demo ticket is ready below.' : 'Email delivery is unavailable for this registration. Save your ticket below.'}</p></div></div>
          <article className="admission-ticket" aria-label="Your event ticket">
            <header><span>EventIQ AI</span><span>{demo ? 'Demo pass' : 'Admission pass'}</span><h1>{event.title}</h1></header>
            <dl>
              <div><dt>Attendee</dt><dd>{registration.name}</dd></div>
              <div><dt>Date and time</dt><dd>{dateLabel(event.startsAt)}</dd></div>
              <div><dt>Location</dt><dd>{event.location}</dd></div>
            </dl>
            <div className="admission-stub">
              {qr && <img src={qr} alt="Ticket QR code" width={174} height={174}/>}
              <span>Ticket code</span><code>{registration.ticket}</code>
              <p>{demo ? 'Fictional listing for trying EventIQ.' : 'Show the QR code or ticket code at check-in.'}</p>
            </div>
          </article>
          <div className="links ticket-actions">
            <button className="btn" onClick={() => window.print()}><Printer size={17}/>Print or save as PDF</button>
            <button className="btn-light" onClick={() => copyTicket(registration.ticket)}><Copy size={16}/>Copy ticket code</button>
          </div>
          {copyMessage && <p className="muted tiny" role="status">{copyMessage}</p>}
        </> : <>
          <div className="banner" style={{ height: 210 }}><CalendarDays size={65}/></div>
          <div style={{ margin: '28px 0' }}>
            <span className="tag">{event.category}</span>
            <h1 className="headline">{event.title}</h1>
            <p className="muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{event.description}</p>
            <div className="links" style={{ marginTop: 24 }}>
              <span className="pill"><Clock3 size={15}/>{dateLabel(event.startsAt)}</span>
              <span className="pill"><MapPin size={15}/>{event.location}</span>
              <span className="pill"><Users size={15}/>{event.registrationCount}/{event.capacity} registered</span>
              <EventDirections event={event}/>
            </div>
          </div>
          <div className="card">
            <h2 className="registration-heading">Reserve your spot</h2>
            <p className="muted tiny" style={{ marginBottom: 24 }}>Free registration · Limited seats</p>
            <form onSubmit={register}>
              <div className="field"><label htmlFor="attendee-name">Full name</label><input id="attendee-name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/></div>
              <div className="field"><label htmlFor="attendee-email">Email address</label><input id="attendee-email" autoComplete="email" type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></div>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="btn" disabled={busy || full || started} style={{ width: '100%' }}>{busy ? 'Registering…' : started ? 'Event already started' : full ? 'Event full' : 'Register now'}</button>
            </form>
          </div>
        </>}
    </div>
  </main>;
}
