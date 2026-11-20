export type EventData = { _id: string; title: string; description: string; location: string; category: string; startsAt: string; capacity: number; registrationCount: number; reservedCount?: number };
export type EventInput = { title: string; description: string; location: string; category: string; startsAt: string; capacity: number };
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}
export function post<T>(url: string, body: unknown, method = 'POST') { return api<T>(url, { method, body: JSON.stringify(body) }); }
export function dateLabel(v: string) { return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
