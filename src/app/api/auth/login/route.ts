import { NextResponse } from 'next/server';
import { database, ensureIndexes } from '@/lib/db';
import { loginCookie } from '@/lib/auth';
import { publicDemo } from '@/lib/public-demo';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
export const runtime = 'nodejs';
const schema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()), password: z.string().min(8).max(128), mode: z.enum(['login', 'signup']) });
export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and password (8+ characters)' }, { status: 400 });
    const { email, password, mode } = parsed.data;
    if (email === publicDemo.email) {
      if (mode !== 'login' || password !== publicDemo.password) {
        return NextResponse.json({ error: 'Use the demo details on the sign-in page' }, { status: 401 });
      }
      await loginCookie(new ObjectId().toHexString(), email, true);
      return NextResponse.json({ email });
    }
    await ensureIndexes();
    const users = (await database()).collection('users');
    let user = await users.findOne({ email });
    if (mode === 'signup') {
      if (user) return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
      const passwordHash = await bcrypt.hash(password, 12);
      try { const result = await users.insertOne({ email, passwordHash, createdAt: new Date() }); user = { _id: result.insertedId, email, passwordHash }; }
      catch (error) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
          return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
        }
        throw error;
      }
    } else if (!user || !(await bcrypt.compare(password, String(user.passwordHash)))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    await loginCookie(String(user!._id), email);
    return NextResponse.json({ email });
  } catch { return NextResponse.json({ error: 'Authentication unavailable. Check server configuration.' }, { status: 500 }); }
}
