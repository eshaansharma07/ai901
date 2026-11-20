import { NextResponse } from 'next/server';
import { database } from '@/lib/db';
import { sessionUser, unauthorized } from '@/lib/auth';
import { ObjectId } from 'mongodb';
export const runtime = 'nodejs';
export async function GET() {
  const user = await sessionUser(); if (!user) return unauthorized();
  const db = await database(); const ownerId = new ObjectId(user.id);
  const ids = (await db.collection('events').find({ ownerId }, { projection: { _id: 1 } }).toArray()).map(e => e._id);
  const [events, upcoming, registrations, checkedIn] = await Promise.all([
    db.collection('events').countDocuments({ ownerId }),
    db.collection('events').countDocuments({ ownerId, startsAt: { $gt: new Date() } }),
    db.collection('registrations').countDocuments({ eventId: { $in: ids } }),
    db.collection('registrations').countDocuments({ eventId: { $in: ids }, checkedInAt: { $ne: null } }),
  ]);
  return NextResponse.json({ events, upcoming, registrations, checkedIn });
}
