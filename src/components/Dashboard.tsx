'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, LayoutDashboard, Plus, Users, Ticket, Sparkles, MapPin, Clock3, ArrowUpRight, LogOut, Trash2, Pencil, CheckCircle2, X } from 'lucide-react';
import { api, post, dateLabel, EventData, EventInput } from '@/lib/client';
import { generateDevicePlan } from '@/lib/device-planner';
const empty: EventInput = { title: '', description: '', location: '', category: 'Technology', startsAt: '', capacity: 100 };
const categories = ['Technology','Workshop','Hackathon','Cultural','Sports','Conference','Other'];
type Stats = { events: number; upcoming: number; registrations: number; checkedIn: number };
export default function Dashboard() {
  const [user, setUser] = useState<{ email: string; demo: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventData[]>([]);
  const [stats, setStats] = useState<Stats>({ events: 0, upcoming: 0, registrations: 0, checkedIn: 0 });
  const [tab, setTab] = useState<'overview'|'events'>('overview');
  const [modal, setModal] = useState(false);
  const [plannerLink, setPlannerLink] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<EventInput>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [deviceDraft, setDeviceDraft] = useState('');
  const [deviceProgress, setDeviceProgress] = useState('');
  const deviceRequest = useRef<AbortController | null>(null);
  const [plan, setPlan] = useState<{ agenda: string[]; checklist: string[]; source: string } | null>(null);
  const [checkin, setCheckin] = useState<EventData | null>(null);
  const [ticket, setTicket] = useState('');
  const [message, setMessage] = useState('');
  async function refresh() {
    const [e, s] = await Promise.all([api<EventData[]>('/api/events?mine=1'), api<Stats>('/api/stats')]);
    setEvents(e); setStats(s);
  }
  useEffect(() => { (async () => { try { const fromPlanner = new URLSearchParams(location.search).get('planner') === '1'; setPlannerLink(fromPlanner); const auth = await api<{ user: { email: string; demo: boolean } | null }>('/api/auth/me'); setUser(auth.user); if (auth.user) { if (fromPlanner) setModal(true); if (!auth.user.demo) await refresh(); } } catch (e) { setError((e as Error).message); } finally { setLoading(false); } })(); }, []);
  useEffect(() => () => deviceRequest.current?.abort(), []);

  async function generateOnDevice() {
    const request = new AbortController();
    deviceRequest.current = request;
    setDeviceDraft('');
    setError('');
    setDeviceProgress('Preparing the device model…');
    try {
      setDeviceDraft(await generateDevicePlan(prompt.trim(), setDeviceProgress, request.signal));
    } catch (error) {
      if (!request.signal.aborted) setError((error as Error).message);
    } finally {
      if (deviceRequest.current === request) {
        deviceRequest.current = null;
        setDeviceProgress('');
      }
    }
  }

  function closePlanner() {
    deviceRequest.current?.abort();
    setModal(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...form, startsAt: new Date(form.startsAt).toISOString(), capacity: Number(form.capacity) };
      if (editing) await post(`/api/events/${editing}`, payload, 'PATCH'); else await post('/api/events', payload);
      setModal(false); setEditing(null); setPlan(null); setForm(empty); await refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function remove(id: string) { if (!confirm('Delete this event and all its registrations?')) return; try { await api(`/api/events/${id}`, { method: 'DELETE' }); await refresh(); } catch (e) { setError((e as Error).message); } }
  function openForm(event?: EventData) { setError(''); setPlan(null); setDeviceDraft(''); setEditing(event?._id || null); setForm(event ? { title: event.title, description: event.description, location: event.location, category: event.category, capacity: event.capacity, startsAt: new Date(event.startsAt).toLocaleString('sv-SE').slice(0,16).replace(' ','T') } : empty); setModal(true); }
  async function generate() { setBusy(true); setError(''); try { const p = await post<EventInput & { agenda: string[]; checklist: string[]; source: string }>('/api/ai/plan', { prompt }); setForm(f => ({ ...f, title: p.title, description: p.description, location: p.location || f.location, category: p.category, capacity: p.capacity })); setPlan({ agenda: p.agenda, checklist: p.checklist, source: p.source }); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function doCheckin(e: React.FormEvent) { e.preventDefault(); if (!checkin) return; setBusy(true); setError(''); setMessage(''); try { const result = await post<{ attendee: string }>(`/api/events/${checkin._id}/checkin`, { ticket: ticket.trim() }); setMessage(`${result.attendee} checked in successfully`); setTicket(''); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  if (loading) return <div className="center card">Loading EventIQ…</div>;
  if (!user) return <main className="workspace-gate"><Link className="workspace-brand" href="/"><CalendarDays size={22}/>EventIQ AI</Link><div className="card"><h1 className="headline">Organizer dashboard</h1><p className="muted">Sign in to manage events, registrations, and check-ins.</p><div className="links" style={{marginTop:24}}><Link className="btn" href={plannerLink ? "/login?planner=1" : "/login"}>Organizer access</Link><Link className="btn-light" href="/events">Explore events</Link></div>{error && <p className="error" role="alert">{error}</p>}</div></main>;
  const visible = tab === 'overview' ? events.filter(e => new Date(e.startsAt) > new Date()) : events;
  return <div className="shell workspace"><aside className="side"><Link className="workspace-brand" href="/"><CalendarDays size={22}/>EventIQ AI</Link><nav aria-label="Organizer navigation"><button className={`nav ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}><LayoutDashboard size={19}/><span>Overview</span></button><button className={`nav ${tab==='events'?'active':''}`} onClick={()=>setTab('events')}><CalendarDays size={19}/><span>My events</span></button><Link className="nav" href="/events"><ArrowUpRight size={19}/><span>Explore events</span></Link><button className="nav" onClick={async()=>{await post('/api/auth/logout',{}); location.href='/login';}}><LogOut size={19}/><span>Sign out</span></button></nav><p className="muted tiny" style={{marginTop:45,overflowWrap:'anywhere'}}>{user.email}</p></aside><main className="content"><div className="toprow"><div><div className="eyebrow">Organizer workspace</div><h1 className="headline">{tab==='overview'?'Welcome back.':'Your events'}</h1><p className="muted">Track events, registrations, and attendee check-ins.</p></div><button className="btn" onClick={()=>openForm()}><Plus size={18}/>Create event</button></div>{user.demo && <p className="workspace-demo-note">Public demo workspace. Try the planner and preview a draft. Publishing and check-in require your own organizer account.</p>}{error&&!modal&&!checkin&&<p className="error">{error}</p>}
  {tab==='overview'&&<><div className="statgrid">{[{icon:<CalendarDays size={21}/>,label:'Total events',value:stats.events},{icon:<Users size={21}/>,label:'Registrations',value:stats.registrations},{icon:<Ticket size={21}/>,label:'Upcoming events',value:stats.upcoming},{icon:<CheckCircle2 size={21}/>,label:'Checked in',value:stats.checkedIn}].map(x=><div className="card" key={x.label}><span>{x.icon}</span><div className="stat">{x.value}</div><div className="muted tiny">{x.label}</div></div>)}</div><div className="hero"><div className="toprow"><div><div className="eyebrow">EventIQ intelligence</div><h2 style={{fontSize:21,fontWeight:800,margin:'9px 0'}}>Plan your next event with AI</h2><p className="muted tiny">Generate a first draft of your event, agenda and checklist. Review before publishing.</p></div><button className="btn" onClick={()=>openForm()}><Sparkles size={17}/>Try AI planner</button></div></div></>}
  <div className="toprow" style={{margin:'30px 0 20px'}}><div><h2 style={{fontSize:22,fontWeight:800}}>{tab==='overview'?'Upcoming events':'All your events'}</h2><p className="muted tiny">{visible.length} event{visible.length===1?'':'s'}</p></div>{tab==='overview'&&<button className="btn-light" onClick={()=>setTab('events')}>View all <ArrowUpRight size={16}/></button>}</div><div className="eventgrid">{visible.map(ev=><article className="card" key={ev._id}><div className="banner"><CalendarDays size={46} strokeWidth={1.3}/></div><div style={{marginTop:17}}><span className="tag">{ev.category}</span></div><h3 className="event-title">{ev.title}</h3><p className="muted tiny" style={{minHeight:36}}>{ev.description.slice(0,110)}{ev.description.length>110?'…':''}</p><div className="meta"><Clock3 size={15}/>{dateLabel(ev.startsAt)}</div><div className="meta"><MapPin size={15}/>{ev.location}</div><div className="meta"><Users size={15}/>{ev.registrationCount}/{ev.capacity} registered</div><div className="links" style={{marginTop:20}}><Link className="btn-light" href={`/events/${ev._id}`}><ArrowUpRight size={16}/>Public page</Link><button className="btn-light" title="Edit" onClick={()=>openForm(ev)}><Pencil size={16}/></button><button className="btn-light" title="Check in" onClick={()=>{setCheckin(ev);setError('');setMessage('');}}><Ticket size={16}/></button><button className="btn-light" title="Delete" onClick={()=>remove(ev._id)}><Trash2 size={16}/></button></div></article>)}</div>{visible.length===0&&<div className="card empty"><CalendarDays size={38} style={{margin:'0 auto 16px',color:'#75a184'}}/><h3 style={{fontWeight:800}}>No events yet</h3><p className="muted tiny">{tab === 'overview' ? 'Upcoming events will appear here.' : 'Publish your first event to get started.'}</p><button className="btn-light" onClick={()=>openForm()}><Plus size={16}/>Create event</button></div>}</main>
  {modal&&<div className="modalback"><div className="modal"><div className="toprow" style={{marginBottom:20}}><h2 style={{fontSize:24,fontWeight:800}}>{editing?'Edit event':'Create an event'}</h2><button onClick={closePlanner} aria-label="Close"><X/></button></div>{!editing&&<div className="card planner-draft"><div className="eyebrow">AI-assisted planning</div><div className="field" style={{marginTop:12}}><label htmlFor="planning-brief">Describe your event</label><textarea id="planning-brief" maxLength={1500} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="A 2-day AI hackathon for 150 students with workshops and demos"/></div><div className="links">
    <button className="btn" disabled={busy || !!deviceProgress || prompt.trim().length < 12} onClick={generateOnDevice}><Sparkles size={16}/>Generate on this device</button>
    <button className="btn-light" disabled={busy || !!deviceProgress || prompt.trim().length < 12} onClick={generate}>{busy ? 'Working…' : 'Quick draft'}</button>
  </div>
  <p className="muted tiny planner-model-note">On-device AI keeps the brief in your browser. The first run downloads approximately 150 MB.</p>
  {deviceProgress && <div className="links"><p role="status">{deviceProgress}</p><button type="button" className="btn-light" onClick={() => deviceRequest.current?.abort()}>Cancel</button></div>}
  {deviceDraft && <div className="device-plan" aria-live="polite">
    <label htmlFor="device-draft">AI-generated plan</label>
    <textarea id="device-draft" value={deviceDraft} onChange={event => setDeviceDraft(event.target.value)} rows={7} maxLength={3000}/>
    <button type="button" className="btn-light" onClick={() => setForm(current => ({ ...current, description: deviceDraft.trim() }))}>Use as event description</button>
  </div>}
  {plan&&<div className="tiny" style={{marginTop:14}} aria-live="polite"><p className="muted">{plan.source === 'model' ? 'AI draft · Review before publishing' : 'Guided draft · Uses an event template'}</p><strong>Suggested agenda</strong><ul style={{paddingLeft:20}}>{plan.agenda.map((x,i)=><li key={i}>{x}</li>)}</ul><strong>Planning checklist</strong><ul style={{paddingLeft:20}}>{plan.checklist.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}</div>}
  <form onSubmit={save}><div className="field"><label>Event name</label><input required minLength={3} maxLength={120} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div><div className="field"><label>Description</label><textarea maxLength={3000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><div className="two"><div className="field"><label>Location</label><input required minLength={2} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div><div className="field"><label>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></div><div className="field"><label>Starts at</label><input required type="datetime-local" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})}/></div><div className="field"><label>Capacity</label><input required type="number" min={1} max={100000} value={form.capacity} onChange={e=>setForm({...form,capacity:Number(e.target.value)})}/></div></div>{error&&<p className="error" role="alert">{error}</p>}<button className="btn" disabled={busy || !!deviceProgress || user.demo} style={{width:'100%'}}>{user.demo?'Publishing disabled in demo':busy?'Saving…':editing?'Save changes':'Publish event'}</button></form></div></div>}
  {checkin&&<div className="modalback"><div className="modal" style={{maxWidth:440}}><div className="toprow"><h2 style={{fontSize:23,fontWeight:800}}>Ticket check-in</h2><button onClick={()=>setCheckin(null)} aria-label="Close"><X/></button></div><p className="muted tiny" style={{margin:'14px 0 20px'}}>{checkin.title} · Paste the code from the attendee ticket.</p><form onSubmit={doCheckin}><div className="field"><label>Ticket code</label><input required value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></div>{error&&<p className="error">{error}</p>}{message&&<p className="success">{message}</p>}<button className="btn" disabled={busy} style={{width:'100%'}}>Verify & check in</button></form></div></div>}
  </div>;
}
