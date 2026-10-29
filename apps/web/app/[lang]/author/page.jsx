import { notFound } from 'next/navigation';
import { AccountAuthor } from '../../../components/account-workspace';
import { api, requireSession } from '../../../lib/server-api';
import { accountCopy } from '../../../lib/account-copy.mjs';
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: accountCopy[lang]?.dashboard, robots: { index: false, follow: false } };
}
export default async function Page({ params, searchParams }) {
  const { lang } = await params;
  if (!accountCopy[lang]) notFound();
  const session = await requireSession(lang, 'author');
  const query = await searchParams;
  const [repos, revisions, capabilities, account] = await Promise.all([
    api('/author/repositories', true),
    api('/author/revisions', true),
    api('/auth/capabilities'),
    api('/auth/account', true),
  ]);
  return (
    <div className="page-container">
      <AccountAuthor
        lang={lang}
        session={session}
        repositories={repos.items}
        revisions={revisions.items}
        repositoriesCursor={repos.nextCursor}
        revisionsCursor={revisions.nextCursor}
        capabilities={capabilities}
        account={account}
        linkStatus={typeof query.link === 'string' ? query.link : ''}
        mergeStatus={typeof query.merge === 'string' ? query.merge : ''}
      />
    </div>
  );
}
