import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { demoReadOnly, sessionUser, unauthorized } from '@/lib/auth';
import { objectId } from '@/lib/common';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function POST(req: Request, { params }: Context) {
  const user = await sessionUser(); if (!user) return unauthorized();
  if (user.demo) return demoReadOnly();
  const id = objectId((await params).id); if (!id) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  const parsed = z.object({ ticket: z.string().uuid() }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 });
  const db = await database();
  const owned = await db.collection('events').findOne({ _id: id, ownerId: new ObjectId(user.id) });
  if (!owned) return NextResponse.json({ error: 'Not your event' }, { status: 403 });
  const result = await db.collection('registrations').findOneAndUpdate(
    { eventId: id, ticket: parsed.data.ticket, checkedInAt: null },
    { $set: { checkedInAt: new Date() } }, { returnDocument: 'after' }
  );
  if (!result) return NextResponse.json({ error: 'Invalid or already checked-in ticket' }, { status: 409 });
  return NextResponse.json({ ok: true, attendee: result.name });
}
