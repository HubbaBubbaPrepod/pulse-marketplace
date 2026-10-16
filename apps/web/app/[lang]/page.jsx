import { ViewTransition } from 'react';
import Link from 'next/link';
import { Hero } from '../../components/hero';
import { Catalog } from '../../components/catalog';
import { parseFilters } from '../../lib/catalog.mjs';
import { catalogRows } from '../../lib/server-api';
import { catalogModule } from '../../lib/api-catalog.mjs';
import { accountCopy } from '../../lib/account-copy.mjs';
import { copy, pathFor } from '../../lib/copy.mjs';
export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: copy[lang]?.catalog || 'Catalog' };
}
export default async function Page({ params, searchParams }) {
  const { lang } = await params,
    query = await searchParams;
  const filters = parseFilters(
    new URLSearchParams(
      Object.entries(query).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : [])),
    ),
  );
  let modules = [],
    unavailable = false;
  try {
    modules = (await catalogRows()).map(catalogModule);
  } catch {
    unavailable = true;
  }
  return (
    <ViewTransition
      enter={{ 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', default: 'none' }}
      default="none"
    >
      <div className="page-container">
        <Hero lang={lang} />
        <section className="service-about" aria-labelledby="service-about-title">
          <h2 id="service-about-title">{copy[lang].serviceTitle}</h2>
          <div>
            <p>{copy[lang].serviceIntro}</p>
            <p>{copy[lang].serviceSignIn}</p>
            <nav aria-label={copy[lang].servicePolicies}>
              <Link href={pathFor(lang, 'privacy')}>{copy[lang].servicePrivacy}</Link>
              <Link href={pathFor(lang, 'terms')}>{copy[lang].serviceTerms}</Link>
            </nav>
          </div>
        </section>
        {unavailable ? (
          <section className="empty-state">
            <h2>{accountCopy[lang].apiUnavailable}</h2>
            <p>{accountCopy[lang].apiUnavailableText}</p>
          </section>
        ) : (
          <Catalog lang={lang} modules={modules} initialFilters={filters} />
        )}
      </div>
    </ViewTransition>
  );
}
