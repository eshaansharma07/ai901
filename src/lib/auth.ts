import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
const name = 'eventiq_session';
function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must have at least 32 characters');
  return new TextEncoder().encode(secret);
}
export async function sessionUser(): Promise<{ id: string; email: string; demo: boolean } | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub || !ObjectId.isValid(payload.sub) || typeof payload.email !== 'string') return null;
    return { id: payload.sub, email: payload.email, demo: payload.demo === true };
  } catch { return null; }
}
export async function loginCookie(id: string, email: string, demo = false) {
  const maxAge = demo ? 7200 : 604800;
  const token = await new SignJWT({ email, demo }).setProtectedHeader({ alg: 'HS256' })
    .setSubject(id).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1000) + maxAge).sign(key());
  (await cookies()).set(name, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge });
}
export async function logoutCookie() { (await cookies()).delete(name); }
export function unauthorized() { return NextResponse.json({ error: 'Organizer login required' }, { status: 401 }); }

export function demoReadOnly() { return NextResponse.json({ error: 'The public demo workspace is read-only. Sign in to your own account to publish or manage events.' }, { status: 403 }); }
