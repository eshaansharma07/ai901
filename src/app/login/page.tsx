'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, FlaskConical } from 'lucide-react';
import { post } from '@/lib/client';
import { publicDemo } from '@/lib/public-demo';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoFilled, setDemoFilled] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await post('/api/auth/login', { mode, email, password });
      location.href = new URLSearchParams(location.search).get('planner') === '1' ? '/dashboard?planner=1' : '/dashboard';
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setMode('login');
    setEmail(publicDemo.email);
    setPassword(publicDemo.password);
    setError('');
    setDemoFilled(true);
  }

  return <main className="auth public-flow">
    <Link href="/" className="brand" style={{ display: 'block' }}>EventIQ AI.</Link>
    <div className="card">
      <div style={{ color: '#c8a6ff' }}><CalendarDays size={32}/></div>
      <h1 className="headline">{mode === 'signup' ? 'Create your workspace' : 'Welcome back'}</h1>
      <p className="muted tiny" style={{ marginBottom: 24 }}>Manage events, registrations, and check-ins.</p>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="username" required value={email} onChange={event => { setEmail(event.target.value); setDemoFilled(false); }} placeholder="you@example.com"/></div>
        <div className="field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={event => { setPassword(event.target.value); setDemoFilled(false); }} placeholder="At least 8 characters"/></div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}<ArrowRight size={17}/></button>
        <button className="btn-light demo-fill" type="button" onClick={fillDemo} disabled={busy}><FlaskConical size={17}/>Fill demo details</button>
        {demoFilled && <p className="muted tiny demo-fill-note" role="status">Demo details filled. Select Sign in to open the public workspace.</p>}
      </form>
      <p className="muted tiny" style={{ textAlign: 'center', marginTop: 22 }}>
        {mode === 'signup' ? 'Already have an account?' : 'New to EventIQ?'}{' '}
        <button type="button" style={{ color: '#d3b4ff', fontWeight: 800 }} onClick={() => {
          setMode(mode === 'signup' ? 'login' : 'signup');
          setError('');
          if (demoFilled) { setEmail(''); setPassword(''); setDemoFilled(false); }
        }}>{mode === 'signup' ? 'Sign in' : 'Create account'}</button>
      </p>
    </div>
    <p style={{ textAlign: 'center', marginTop: 20 }}><Link className="muted tiny" href="/events">Browse public events →</Link></p>
  </main>;
}
