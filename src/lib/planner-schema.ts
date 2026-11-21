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

function minutesSinceMidnight(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function resolveAgenda(agenda: PlannerDraft['agenda']) {
  const sorted = [...agenda].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  let end = 0;
  let day = 0;
  let adjusted = false;
  const resolved = [];

  for (const [index, slot] of sorted.entries()) {
    if (slot.day !== day) {
      day = slot.day;
      end = 0;
    }
    const requested = minutesSinceMidnight(slot.time);
    const start = Math.max(requested, end);
    const next = sorted[index + 1];
    const limit = next?.day === day ? minutesSinceMidnight(next.time) : 1440;
    // Keep the next planned start where there is room for a useful block.
    const available = limit - start;
    const minutes = available >= 5 ? Math.min(slot.minutes, available) : slot.minutes;
    end = start + minutes;
    if (end > 1440) {
      return { agenda: sorted, notice: 'Some activities cannot fit on the same day. Ask Gemini to shorten or reschedule them before using the agenda.' };
    }
    adjusted ||= start !== requested || minutes !== slot.minutes;
    const time = [Math.floor(start / 60), start % 60].map(value => String(value).padStart(2, '0')).join(':');
    resolved.push({ ...slot, time, minutes });
  }

  return { agenda: resolved, notice: adjusted ? 'Some start times or durations were adjusted to prevent overlaps. Review the revised timings before sharing.' : '' };
}
