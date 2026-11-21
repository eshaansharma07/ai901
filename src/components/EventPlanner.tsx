'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api, type EventInput } from '@/lib/client';
import type { PlannerDraft } from '@/lib/planner-schema';

const example = 'Plan a two-day AI hackathon for 150 students in Chandigarh. Run 10:00–17:00 each day, with a beginner workshop, mentoring, and final demos.';

export default function EventPlanner({ apply }: { apply: (draft: PlannerDraft) => void }) {
  const [brief, setBrief] = useState('');
  const [original, setOriginal] = useState('');
  const [revision, setRevision] = useState('');
  const [draft, setDraft] = useState<PlannerDraft>();
  const [completed, setCompleted] = useState<number[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [agendaNotice, setAgendaNotice] = useState('');
  const [applied, setApplied] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const result = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => pending.current?.abort(), []);

  async function generate(change?: string) {
    if (pending.current) return;
    const prompt = change ? original : brief.trim();
    const request = new AbortController();
    pending.current = request;
    setError('');
    setApplied(false);
    setStatus(change ? 'Gemini is revising your plan…' : 'Gemini is building your plan…');
    try {
      const { plan, agendaNotice } = await api<{ plan: PlannerDraft; agendaNotice: string }>('/api/ai/plan', {
        method: 'POST',
        body: JSON.stringify(change ? { prompt, previous: draft, revision: change } : { prompt }),
        signal: request.signal,
      });
      if (request.signal.aborted) return;
      setOriginal(prompt);
      setDraft(plan);
      setAgendaNotice(agendaNotice);
      setCompleted([]);
      setRevision('');
      requestAnimationFrame(() => result.current?.focus());
    } catch (err) {
      if (!request.signal.aborted) setError((err as Error).message);
    } finally {
      pending.current = null;
      if (!request.signal.aborted) setStatus('');
    }
  }

  return <section className="card planner-draft" aria-label="Gemini event planner">
    <h3 className="planner-heading"><Sparkles size={19} /> Gemini planner</h3>
    <div className="field">
      <label htmlFor="planning-brief">Describe your event</label>
      <textarea id="planning-brief" maxLength={1500} value={brief} disabled={!!status}
        onChange={event => setBrief(event.target.value)} placeholder="Include the audience, timing, venue, and any constraints." />
    </div>
    <div className="links">
      <button type="button" className="btn" disabled={!!status || brief.trim().length < 12} onClick={() => generate()}>
        <Sparkles size={16} />{draft ? 'Generate a new plan' : 'Generate with Gemini'}
      </button>
      <button type="button" className="btn-light" disabled={!!status} onClick={() => setBrief(example)}>Try an example</button>
    </div>
    <p className="muted tiny planner-model-note">Gemini uses your brief to draft the listing, agenda, and organizer checklist.</p>
    <p role="status">{status}</p>
    {error && <p className="error" role="alert">{error}</p>}
    {draft && <div className="planner-result">
      <h3 ref={result} tabIndex={-1}>{draft.title}</h3>
      <p className="muted tiny">{[draft.category, draft.location, draft.capacity && `${draft.capacity} attendees`].filter(Boolean).join(' · ')}</p>
      <p>{draft.description}</p>
      <p className="muted tiny">{draft.revisionNote}</p>
      <details open><summary>Agenda</summary>
        {agendaNotice && <p className="muted tiny">{agendaNotice}</p>}
        {[...new Set(draft.agenda.map(slot => slot.day))].map(day => <section className="agenda-day" key={day}>
          <h4>Day {day}</h4>
          <ol className="agenda-timeline">{draft.agenda.filter(slot => slot.day === day).map((slot, index) => <li key={index}>
            <time>{slot.time}</time><span>{slot.activity}<small>{slot.minutes} min</small></span>
          </li>)}</ol>
        </section>)}
      </details>
      <details><summary>Organizer checklist · {completed.length}/{draft.checklist.length}</summary>
        <ul>{draft.checklist.map((item, index) => <li key={index}><label>
          <input type="checkbox" checked={completed.includes(index)}
            onChange={event => {
              const checked = event.target.checked;
              setCompleted(items => checked ? [...items, index] : items.filter(item => item !== index));
            }} />
          {' '}<strong>{item.owner}</strong> · {item.task}
        </label></li>)}</ul>
      </details>
      <details><summary>Risks and assumptions</summary>
        <ul>{[...draft.risks, ...draft.assumptions].map((item, index) => <li key={index}>{item}</li>)}</ul>
      </details>
      <div className="field">
        <label htmlFor="planner-revision">Ask Gemini to revise the plan</label>
        <textarea id="planner-revision" rows={2} maxLength={600} disabled={!!status} value={revision}
          onChange={event => setRevision(event.target.value)} placeholder="For example, shorten day two and add a judging buffer." />
      </div>
      <div className="links">
        {draft.followUps.map((suggestion, index) => <button type="button" className="btn-light" key={index}
          disabled={!!status} onClick={() => setRevision(suggestion)}>{suggestion}</button>)}
      </div>
      <div className="links">
        <button type="button" className="btn" disabled={!!status || revision.trim().length < 2}
          onClick={() => generate(revision.trim())}>Revise with Gemini</button>
        <button type="button" className="btn-light" disabled={!!status} onClick={() => { apply(draft); setApplied(true); }}>Fill event form</button>
      </div>
      {applied && <p role="status">Draft applied. Review the event details and choose a start date below.</p>}
    </div>}
  </section>;
}

export function applyPlannerDraft(form: EventInput, draft: PlannerDraft): EventInput {
  return {
    ...form,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    location: draft.location || form.location,
    capacity: draft.capacity ?? form.capacity,
  };
}
