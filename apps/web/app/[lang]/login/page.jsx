import { Login } from '../../../components/login';
import { copy } from '../../../lib/copy.mjs';
import { api } from '../../../lib/server-api';
import { notFound, redirect } from 'next/navigation';
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: copy[lang]?.login };
}
export default async function Page({ params, searchParams }) {
  const { lang } = await params;
  if (!copy[lang]) notFound();
  const session = await api('/auth/session', true);
  if (session.user) {
    const query = await searchParams;
    redirect(
      typeof query.next === 'string' && /^\/(ru|en)\/(author|moderation)\/$/.test(query.next)
        ? query.next
        : `/${lang}/author/`,
    );
  }
  return (
    <div className="page-container">
      <Login lang={lang} capabilities={await api('/auth/capabilities').catch(() => ({}))} />
    </div>
  );
}
