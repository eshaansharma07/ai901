import { NextResponse } from 'next/server';
import { sessionUser, unauthorized } from '@/lib/auth';
import { database } from '@/lib/db';
import { plannerSchema, resolveAgenda } from '@/lib/planner-schema';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

const inputSchema = z.object({
  prompt: z.string().trim().min(12).max(1500),
  previous: plannerSchema.optional(),
  revision: z.string().trim().min(2).max(600).optional(),
}).refine(input => Boolean(input.previous) === Boolean(input.revision));

const model = 'gemini-3.5-flash-lite';
const instructions = [
  'You are the EventIQ organizer planner. Create a practical draft tailored to the user’s brief.',
  'For a revision, update the previous draft using the revision request. Preserve stated constraints and unrelated decisions.',
  'Use venue and capacity only when supplied by the user, otherwise use empty location and null capacity. Do not claim bookings, prices, approvals, or venue facts.',
  'Provide a chronological agenda for each requested event day, within the stated hours, including transitions and breaks as appropriate. Use local 24-hour times and avoid overlaps. Use the specified start time and label an unspecified end time as an assumption. Use a single timeline with no parallel sessions.',
  'State any assumptions about schedule, venue, budget, or staffing. Give concrete checklist tasks with suggested roles and risks with mitigations.',
  'Offer brief actionable follow-up requests that would improve this specific plan. Use revisionNote to explain meaningful changes or summarize the initial plan.',
  'Write the description as public listing copy. Keep operational details in the other sections.',
].join('\n');

export async function POST(request: Request) {
  const user = await sessionUser();
  if (!user) return unauthorized();

  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: 'Enter an event brief of 12–1,500 characters and keep revisions under 600 characters.' }, { status: 400 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: 'Gemini is unavailable. You can still fill out the event form.' }, { status: 503 });

  try {
    const db = await database();
    const usage = db.collection<{ _id: string; used: number }>('ai_usage');
    const bucket = 'gemini-planner:' + new Date().toISOString().slice(0, 10);
    const permit = await usage.updateOne({ _id: bucket, used: { $lt: 40 } }, { $inc: { used: 1 } }, { upsert: true }).catch(error => {
      if (error?.code === 11000) return null;
      throw error;
    });
    if (!permit) return NextResponse.json({ error: 'The planner has reached its daily limit. Try again tomorrow.' }, { status: 429 });

    const { $schema, ...responseJsonSchema } = z.toJSONSchema(plannerSchema);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(input.data) }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4500, responseMimeType: 'application/json', responseJsonSchema },
      }),
      signal: AbortSignal.timeout(23000),
    });
    if (response.status === 429) {
      return NextResponse.json({ error: 'Gemini has reached its request limit. Try again later.' }, { status: 429 });
    }
    if (!response.ok) throw new Error('Gemini planner request failed');
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts
      ?.filter((part: { thought?: boolean }) => !part.thought)
      .map((part: { text?: string }) => part.text ?? '').join('');
    const plan = plannerSchema.parse(JSON.parse(content ?? ''));
    const { agenda, notice } = resolveAgenda(plan.agenda);
    return NextResponse.json({ plan: { ...plan, agenda }, agendaNotice: notice });
  } catch {
    return NextResponse.json({ error: 'Gemini couldn’t finish this plan. Try again in a moment.' }, { status: 502 });
  }
}
