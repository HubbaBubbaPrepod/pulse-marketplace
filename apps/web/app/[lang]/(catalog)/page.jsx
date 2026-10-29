import { CatalogNavigation } from '../../../components/catalog-navigation';
import { notFound } from 'next/navigation';
import { ViewTransition } from 'react';
import { StructuredData } from '../../../components/structured-data';
import { catalogMetadata, pageSchema, seoCopy } from '../../../lib/seo.mjs';
import Link from 'next/link';
import { Hero } from '../../../components/hero';
import { Catalog } from '../../../components/catalog';
import { parseFilters } from '../../../lib/catalog.mjs';
import { catalogPage } from '../../../lib/server-api';
import { catalogModule } from '../../../lib/api-catalog.mjs';
import { accountCopy } from '../../../lib/account-copy.mjs';
import { copy, pathFor } from '../../../lib/copy.mjs';
export async function generateMetadata({ params, searchParams }) {
  const { lang } = await params;
  if (!seoCopy[lang]) return {};
  return catalogMetadata(lang, await searchParams);
}
export default async function Page({ params, searchParams }) {
  const { lang } = await params,
    query = await searchParams;
  if (!seoCopy[lang]) notFound();
  const filters = parseFilters(
    new URLSearchParams(
      Object.entries(query).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : [])),
    ),
  );
  let rows = [],
    modules = [],
    total = 0,
    nextPage = null,
    unavailable = false;
  const page =
    typeof query.page === 'string' && /^[0-9]{1,5}$/.test(query.page) ? Number(query.page) : 0;
  try {
    const result = await catalogPage(filters, page);
    rows = result.items;
    total = result.total;
    nextPage = result.nextPage;
    modules = rows.map(catalogModule);
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
        <StructuredData
          data={pageSchema(
            lang,
            '',
            seoCopy[lang].title,
            seoCopy[lang].description,
            unavailable || Object.keys(query).length ? undefined : rows,
          )}
        />
        <Hero lang={lang} />
        <CatalogNavigation lang={lang} />
        <section className="service-about" aria-labelledby="service-about-title">
          <h2 id="service-about-title">{copy[lang].serviceTitle}</h2>
          <div>
            <p>{copy[lang].serviceIntro}</p>
            <p>{copy[lang].serviceSignIn}</p>
            <nav aria-label={copy[lang].servicePolicies}>
              <Link href={pathFor(lang, 'privacy')}>{copy[lang].servicePrivacy}</Link>
              <Link href={pathFor(lang === 'ru' ? 'en' : 'ru', 'privacy')}>
                {copy[lang].serviceOtherPrivacy}
              </Link>
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
          <Catalog
            key={JSON.stringify(query)}
            lang={lang}
            modules={modules}
            initialFilters={filters}
            pageMode
            total={total}
            page={page}
            nextPage={nextPage}
          />
        )}
      </div>
    </ViewTransition>
  );
}
