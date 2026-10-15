import { ViewTransition } from 'react';
import { Hero } from '../../components/hero';
import { Catalog } from '../../components/catalog';
import { parseFilters } from '../../lib/catalog.mjs';
import { catalogRows } from '../../lib/server-api';
import { catalogModule } from '../../lib/api-catalog.mjs';
import { accountCopy } from '../../lib/account-copy.mjs';
import { copy } from '../../lib/copy.mjs';
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
