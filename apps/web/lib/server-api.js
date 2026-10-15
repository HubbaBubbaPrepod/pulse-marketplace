import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export class ApiError extends Error {
  constructor(status) {
    super('Marketplace API request failed');
    this.status = status;
  }
}
export async function api(path, authenticated = false) {
  const headers = authenticated ? { cookie: (await cookies()).toString() } : {};
  let response;
  try {
    response = await fetch(`${process.env.API_ORIGIN || 'http://127.0.0.1:3101'}/api/v1${path}`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ApiError(503);
  }
  if (!response.ok) throw new ApiError(response.status);
  return response.json();
}
export async function requireSession(lang, section) {
  const session = await api('/auth/session', true);
  if (!session.user) redirect(`/${lang}/login/?next=${encodeURIComponent(`/${lang}/${section}/`)}`);
  return session;
}
export async function catalogRows() {
  const items = [];
  let cursor = '';
  do {
    const page = await api(`/catalog${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
    items.push(...page.items);
    if (page.nextCursor === cursor) throw new ApiError(502);
    cursor = page.nextCursor;
  } while (cursor && items.length < 3000);
  if (cursor) throw new ApiError(503);
  return items;
}
