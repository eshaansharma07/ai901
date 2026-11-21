import { NextResponse } from 'next/server';
import { database, ensureIndexes } from '@/lib/db';
import { sessionUser, unauthorized } from '@/lib/auth';
import { eventSchema, publicListings, serializeEvent } from '@/lib/common';
import { ObjectId } from 'mongodb';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  try {
    const db = await database();
    const params = new URL(req.url).searchParams;
    const mine = params.get('mine') === '1';
    const user = mine ? await sessionUser() : null;
    if (mine && !user) return unauthorized();
    const query = mine ? { ownerId: new ObjectId(user!.id) } : { ...publicListings, ...(params.get('upcoming') === '1' ? { startsAt: { $gt: new Date() } } : {}) };
    const events = await db.collection('events').aggregate([
      { $match: query }, { $sort: { startsAt: 1 } }, { $limit: 100 },
      { $lookup: { from: 'registrations', localField: '_id', foreignField: 'eventId', as: 'registrations' } },
      { $addFields: { registrationCount: { $size: '$registrations' } } },
      { $project: { registrations: 0, ownerId: 0 } },
    ]).toArray();
    return NextResponse.json(events.map(e => ({ ...e, _id: String(e._id) })));
  } catch { return NextResponse.json({ error: 'Unable to load events' }, { status: 500 }); }
}
export async function POST(req: Request) {
  const user = await sessionUser(); if (!user) return unauthorized();
  try {
    const parsed = eventSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Check event fields and date' }, { status: 400 });
    const startsAt = new Date(parsed.data.startsAt);
    if (startsAt <= new Date()) return NextResponse.json({ error: 'Choose a future date' }, { status: 400 });
    await ensureIndexes();
    const doc = { ...parsed.data, startsAt, ownerId: new ObjectId(user.id), published: true, ...(user.demo ? { demoExpiresAt: user.expiresAt } : {}), createdAt: new Date() };
    const result = await (await database()).collection('events').insertOne(doc);
    return NextResponse.json(serializeEvent({ ...doc, _id: result.insertedId }), { status: 201 });
  } catch { return NextResponse.json({ error: 'Unable to create event' }, { status: 500 }); }
}
