import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
export const plannerSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: text(1400),
  location: z.string().trim().max(160),
  category: z.enum(['Technology', 'Workshop', 'Hackathon', 'Cultural', 'Sports', 'Conference', 'Other']),
  capacity: z.number().int().min(1).max(100000).nullable(),
  agenda: z.array(z.object({
    day: z.number().int().min(1).max(30),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    activity: text(120),
    minutes: z.number().int().min(5).max(720),
  })).min(1).max(30),
  checklist: z.array(z.object({ owner: text(70), task: text(200) })).min(1).max(8),
  risks: z.array(text(200)).min(1).max(6),
  assumptions: z.array(text(200)).max(8),
  followUps: z.array(text(140)).min(1).max(3),
  revisionNote: text(250),
});
export type PlannerDraft = z.infer<typeof plannerSchema>;

export function validAgenda(agenda: PlannerDraft['agenda']) {
  let previousEnd = 0;
  for (const { day, time, minutes } of agenda) {
    const [hours, mins] = time.split(':').map(Number);
    const withinDay = hours * 60 + mins;
    const start = (day - 1) * 1440 + withinDay;
    if (start < previousEnd || withinDay + minutes > 1440) return false;
    previousEnd = start + minutes;
  }
  return true;
}
