import { ObjectId } from 'mongodb';
import { z } from 'zod';
export const eventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(3000).default(''),
  location: z.string().trim().min(2).max(160),
  category: z.enum(['Technology', 'Workshop', 'Hackathon', 'Cultural', 'Sports', 'Conference', 'Other']),
  startsAt: z.string().datetime({ offset: true }),
  capacity: z.number().int().min(1).max(100000),
});
export const registrationSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(254).transform(x => x.toLowerCase().trim()) });
export function objectId(id: string) { return ObjectId.isValid(id) && new ObjectId(id).toHexString() === id.toLowerCase() ? new ObjectId(id) : null; }
export function fail(error: unknown) { return { error: error instanceof Error ? error.message : 'Something went wrong' }; }
export function serializeEvent(event: Record<string, unknown>, count = 0) {
  return { ...event, _id: String(event._id), ownerId: undefined, registrationCount: count };
}
