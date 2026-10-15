import { notFound } from 'next/navigation';
import { AccountModeration } from '../../../components/account-workspace';
import { api, requireSession } from '../../../lib/server-api';
import { accountCopy } from '../../../lib/account-copy.mjs';
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: accountCopy[lang]?.moderation, robots: { index: false, follow: false } };
}
export default async function Page({ params, searchParams }) {
  const { lang } = await params;
  if (!accountCopy[lang]) notFound();
  const session = await requireSession(lang, 'moderation');
  if (!['moderator', 'administrator'].includes(session.user.role)) notFound();
  const query = await searchParams;
  const status = ['pending', 'approved', 'rejected', 'withdrawn'].includes(query.status)
    ? query.status
    : 'pending';
  const records = await api(`/moderation/revisions?status=${status}`, true);
  return (
    <div className="page-container">
      <AccountModeration
        key={`${status}:${records.items.map((item) => item.id).join(',')}`}
        lang={lang}
        session={session}
        records={records.items}
        status={status}
        nextCursor={records.nextCursor}
      />
    </div>
  );
}
