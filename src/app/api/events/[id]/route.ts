import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { demoReadOnly, sessionUser, unauthorized } from '@/lib/auth';
import { eventSchema, objectId } from '@/lib/common';
import { ObjectId } from 'mongodb';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  const id = objectId((await params).id); if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  const db = await database(); const event = await db.collection('events').findOne({ _id: id, published: true }, { projection: { ownerId: 0 } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  const registrationCount = await db.collection('registrations').countDocuments({ eventId: id });
  return NextResponse.json({ ...event, _id: String(event._id), registrationCount });
}
export async function PATCH(req: Request, { params }: Context) {
  const user = await sessionUser(); if (!user) return unauthorized();
  if (user.demo) return demoReadOnly();
  const id = objectId((await params).id); if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  const parsed = eventSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: 'Invalid event fields' }, { status: 400 });
  const startsAt = new Date(parsed.data.startsAt); if (startsAt <= new Date()) return NextResponse.json({ error: 'Choose a future date' }, { status: 400 });
  const db = await database(); const registrations = await db.collection('registrations').countDocuments({ eventId: id });
  if (parsed.data.capacity < registrations) return NextResponse.json({ error: 'Capacity cannot be below current registrations' }, { status: 409 });
  const result = await db.collection('events').updateOne({ _id: id, ownerId: new ObjectId(user.id) }, { $set: { ...parsed.data, startsAt } });
  if (!result.matchedCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
export async function DELETE(_: Request, { params }: Context) {
  const user = await sessionUser(); if (!user) return unauthorized();
  if (user.demo) return demoReadOnly();
  const id = objectId((await params).id); if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  const db = await database();
  const result = await db.collection('events').deleteOne({ _id: id, ownerId: new ObjectId(user.id) });
  if (!result.deletedCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await db.collection('registrations').deleteMany({ eventId: id });
  return NextResponse.json({ ok: true });
}
