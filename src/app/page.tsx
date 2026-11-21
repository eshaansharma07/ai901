import EventIQBrand from '@/components/EventIQBrand';
import Link from 'next/link';
import LandingMotion from '@/components/LandingMotion';
import NearbyEvents from '@/components/NearbyEvents';
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, CircleCheck, LayoutDashboard, MapPin, Search, Sparkles, Ticket, Users } from 'lucide-react';

const workflow = [
  { title: 'Find or publish', detail: 'Browse upcoming events or create a public event page with a date, location, and capacity.' },
  { title: 'Reserve a spot', detail: 'Register on the event page and save your unique QR ticket. Hosts track signups from their dashboard.' },
  { title: 'Show up and check in', detail: 'Bring your ticket to the door. Hosts verify ticket codes and track attendance as guests arrive.' },
];

const questions = [
  { question: 'Do attendees need an account?', answer: 'No. Attendees can browse public events and register with their name and email. They’ll get a QR ticket to save after registration.' },
  { question: 'Can I plan an event without AI?', answer: 'Yes. Organizers can fill out the event form directly. You can also ask the planner for a draft and edit it before publishing.' },
  { question: 'How do I check in an attendee?', answer: 'Open the event in your dashboard, choose Check in, and enter the code from the attendee’s ticket.' },
];

const sampleRegistrations = [18, 25, 21, 36, 28, 42, 48, 40, 56, 50, 68, 76];

function DashboardPreview() {
  return <div className="launch-preview" data-reveal>
    <div className="launch-preview-header">
      <span><LayoutDashboard size={18} aria-hidden="true"/> Organizer overview</span>
      <span className="launch-sample">Sample data</span>
    </div>
    <div className="launch-preview-body">
      <div className="launch-metrics">
        <div><CalendarDays size={17}/><span>Upcoming events</span><strong>3</strong></div>
        <div><Users size={17}/><span>Registrations</span><strong>312</strong></div>
        <div><CircleCheck size={17}/><span>Checked in</span><strong>184</strong></div>
      </div>
      <div className="launch-chart">
        <div className="launch-chart-head"><strong>Registration activity</strong><span>Sample period</span></div>
        <div className="launch-chart-bars" role="img" aria-label="Illustrative bar chart showing a rise in registrations over a sample period">
          {sampleRegistrations.map((value, index) => <i key={index} style={{ height: value + '%' }}/>)}
        </div>
      </div>
    </div>
  </div>;
}



export default function Home() {
  return <LandingMotion>
    <header className="launch-header launch-wrap">
      <EventIQBrand className="launch-brand" />
      <nav aria-label="Main navigation" className="launch-nav">
        <Link href="/events">Find an event</Link>
        <Link href="/dashboard" className="launch-outline">Host an event <ArrowUpRight size={15}/></Link>
      </nav>
    </header>
    <main>
      <section className="launch-hero launch-wrap">
        <div className="launch-copy">
          <h1>Your city.<br/><em>Your plans.</em></h1>
          <p>Find what’s happening nearby, grab a ticket, or host an event of your own.</p>
          <div className="launch-actions">
            <Link href="/events" className="launch-primary">See all events <ArrowRight size={18}/></Link>
            <a href="#host" className="launch-outline">Host an event <ArrowUpRight size={16}/></a>
          </div>
        </div>
        <div className="launch-visual hero-visual" aria-hidden="true">
          <div className="hero-scene">
            <div className="hero-ring hero-ring-a"/><div className="hero-ring hero-ring-b"/><div className="hero-ring hero-ring-c"/>
            <div className="hero-object hero-object-pin"><MapPin size={43} strokeWidth={1.5}/></div>
            <div className="hero-object hero-object-calendar"><CalendarDays size={39} strokeWidth={1.5}/></div>
            <div className="hero-object hero-object-ticket">
              <div><Ticket size={25} strokeWidth={1.55}/><span>EventIQ AI</span></div>
              <div className="hero-ticket-bars"/>
            </div>
            <div className="hero-object hero-object-spark"><Sparkles size={23}/></div>
          </div>
        </div>
      </section>
      <NearbyEvents/>
      <section className="launch-features" aria-label="Find or host an event">
        <div className="launch-wrap journey-grid">
          <article id="find" className="journey-card journey-find">
            <span className="ai-label"><Search size={16}/> For attendees</span>
            <h2>Find something you’ll show up for.</h2>
            <p>Tell the AI Finder what you’re looking for. It ranks upcoming events by your interests and timing.</p>
            <form action="/events" className="finder-form">
              <label className="sr-only" htmlFor="home-query">Describe the event you want to find</label>
              <input id="home-query" name="q" maxLength={180} placeholder="Live music this weekend" required/>
              <button className="btn" type="submit"><Sparkles size={16}/> Find with AI</button>
            </form>
            <Link href="/events">Browse all events <ArrowUpRight size={16}/></Link>
          </article>
          <article id="host" className="journey-card journey-host">
            <span className="ai-label"><Sparkles size={16}/> For hosts</span>
            <h2>Turn an idea into an event.</h2>
            <p>Generate a plan on your device, or start with a quick draft and checklist. Review your details before publishing.</p>
            <div className="journey-host-actions">
              <Link href="/dashboard?planner=1" className="launch-primary"><Sparkles size={16}/> Open AI Planner</Link>
              <Link href="/dashboard">Organizer dashboard <ArrowUpRight size={16}/></Link>
            </div>
          </article>
        </div>
      </section>
      <section className="launch-showcase launch-wrap" aria-labelledby="showcase-title">
        <div className="launch-section-copy" data-reveal>
          <h2 id="showcase-title">See how the event is shaping up.</h2>
          <p>Keep upcoming events, registrations, and check-ins in view. Open any event to edit the details, share its public page, or verify a ticket.</p>
          <Link href="/dashboard" className="launch-outline">Open dashboard <ArrowUpRight size={17}/></Link>
        </div>
        <DashboardPreview/>
      </section>
      <section className="launch-workflow" aria-labelledby="workflow-title">
        <div className="launch-wrap">
          <div className="launch-section-copy" data-reveal><h2 id="workflow-title">From event page to event day.</h2></div>
          <ol className="launch-steps">
            {workflow.map(({ title, detail }, index) => <li key={title} data-reveal>
              <span className="launch-step-number" aria-hidden="true">{index + 1}</span>
              <h3>{title}</h3><p>{detail}</p>
            </li>)}
          </ol>
        </div>
      </section>
      <section className="launch-faq launch-wrap" aria-labelledby="faq-title">
        <div className="launch-section-copy"><h2 id="faq-title">Good to know.</h2></div>
        <div className="launch-questions">
          {questions.map(({ question, answer }) => <details key={question}>
            <summary>{question}<ChevronDown size={18} aria-hidden="true"/></summary><p>{answer}</p>
          </details>)}
        </div>
      </section>
      <section className="launch-wrap closing-wrap">
        <div className="launch-closing" data-reveal>
          <h2>What are you bringing people together for?</h2>
          <div className="launch-closing-actions">
            <Link href="/dashboard" className="launch-primary">Organize an event <ArrowRight size={18}/></Link>
            <Link href="/events" className="launch-secondary">Find an event <ArrowUpRight size={17}/></Link>
          </div>
        </div>
      </section>
    </main>
    <footer className="launch-footer launch-wrap"><EventIQBrand className="launch-brand" /><Link href="/events">Explore events <ArrowUpRight size={15}/></Link></footer>
  </LandingMotion>;
}
