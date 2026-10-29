import { notFound } from 'next/navigation';
import { Themes } from '../../../components/themes';
import { themesPage } from '../../../lib/server-api';
import { themeCopy } from '../../../lib/theme-catalog.mjs';
import { publicMetadata, pageSchema } from '../../../lib/seo.mjs';
import { StructuredData } from '../../../components/structured-data';
export async function generateMetadata({ params, searchParams }) {
  const { lang } = await params;
  if (!themeCopy[lang]) return {};
  return publicMetadata(
    lang,
    'themes',
    themeCopy[lang].themes + ' · Pulse Monitor',
    themeCopy[lang].intro,
    Object.keys(await searchParams).length === 0,
  );
}
export default async function Page({ params, searchParams }) {
  const { lang } = await params;
  if (!themeCopy[lang]) notFound();
  let rows = [],
    total = 0,
    nextPage = null,
    unavailable = false;
  const query = await searchParams;
  const page =
    typeof query.page === 'string' && /^[0-9]{1,5}$/.test(query.page) ? Number(query.page) : 0;
  const filters = {
    query: typeof query.q === 'string' ? query.q.slice(0, 128) : '',
    mode: ['dark', 'light'].includes(query.mode) ? query.mode : 'all',
  };
  try {
    const result = await themesPage(filters, page);
    rows = result.items;
    total = result.total;
    nextPage = result.nextPage;
  } catch {
    unavailable = true;
  }
  const t = themeCopy[lang];
  return (
    <div className="page-container">
      <StructuredData
        data={pageSchema(lang, 'themes', t.themes, t.intro, unavailable ? undefined : rows)}
      />
      <Themes
        key={JSON.stringify(query)}
        lang={lang}
        rows={rows}
        unavailable={unavailable}
        pageMode
        initialFilters={filters}
        total={total}
        page={page}
        nextPage={nextPage}
      />
    </div>
  );
}
