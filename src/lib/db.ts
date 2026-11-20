import { MongoClient, Db } from 'mongodb';
let clientPromise: Promise<MongoClient> | undefined;
export async function database(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');
  if (!clientPromise) clientPromise = new MongoClient(uri, { maxPoolSize: 10 }).connect();
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'eventiq');
}
export async function ensureIndexes() {
  const db = await database();
  await Promise.all([
    db.collection('registrations').createIndex({ eventId: 1, email: 1 }, { unique: true }),
    db.collection('registrations').createIndex({ ticket: 1 }, { unique: true }),
    db.collection('events').createIndex({ startsAt: 1 }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
  ]);
}
