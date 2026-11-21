export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const latitude = request.headers.get('x-vercel-ip-latitude');
  const longitude = request.headers.get('x-vercel-ip-longitude');
  const lat = latitude?.trim() ? Number(latitude) : NaN;
  const lng = longitude?.trim() ? Number(longitude) : NaN;
  const encodedCity = request.headers.get('x-vercel-ip-city') ?? '';
  let city = encodedCity;
  try { city = decodeURIComponent(encodedCity); } catch {}
  const point = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [Math.round(lat * 100) / 100, Math.round(lng * 100) / 100]
    : null;
  return Response.json(point || city ? { point, city } : null, { headers: { 'Cache-Control': 'private, no-store' } });
}
