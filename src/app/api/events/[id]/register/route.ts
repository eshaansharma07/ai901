import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { database, ensureIndexes } from '@/lib/db';
import { sendTicketEmail } from '@/lib/ticket-email';
import { registrationSchema, objectId } from '@/lib/common';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function POST(req: Request, { params }: Context) {
  const id = objectId((await params).id); if (!id) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  const parsed = registrationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter valid name and email' }, { status: 400 });
  try {
    await ensureIndexes(); const db = await database();
    const event = await db.collection('events').findOne({ _id: id, published: true });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (new Date(event.startsAt) <= new Date()) return NextResponse.json({ error: 'Event already started' }, { status: 409 });
    const existing = await db.collection('registrations').findOne({ eventId: id, email: parsed.data.email });
    if (existing) return NextResponse.json({ error: 'This email is already registered' }, { status: 409 });
    // Atomic reservation counter prevents concurrent registrations from exceeding capacity.
    const reserved = await db.collection('events').findOneAndUpdate(
      { _id: id, published: true, startsAt: { $gt: new Date() }, $expr: { $lt: [{ $ifNull: ['$reservedCount', 0] }, '$capacity'] } },
      { $inc: { reservedCount: 1 } }, { returnDocument: 'after' }
    );
    if (!reserved) return NextResponse.json({ error: 'Event is full' }, { status: 409 });
    const ticket = randomUUID();
    try {
      await db.collection('registrations').insertOne({ eventId: id, ...parsed.data, ticket, checkedInAt: null, createdAt: new Date() });
    } catch (e) {
      await db.collection('events').updateOne({ _id: id }, { $inc: { reservedCount: -1 } });
      if (typeof e === 'object' && e && 'code' in e && e.code === 11000) return NextResponse.json({ error: 'This email is already registered' }, { status: 409 });
      throw e;
    }

    const emailStatus = await sendTicketEmail({
      ...parsed.data, ticket, title: String(event.title), location: String(event.location),
      startsAt: new Date(event.startsAt), demo: /^demo · /i.test(String(event.title)),
    });
    return NextResponse.json({ ticket, eventTitle: event.title, name: parsed.data.name, emailStatus }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Registration unavailable' }, { status: 500 }); }
}
