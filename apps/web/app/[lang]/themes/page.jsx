import { notFound } from 'next/navigation';
import { Themes } from '../../../components/themes';
import { themeRows } from '../../../lib/server-api';
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
export default async function Page({ params }) {
  const { lang } = await params;
  if (!themeCopy[lang]) notFound();
  let rows = [],
    unavailable = false;
  try {
    rows = await themeRows();
  } catch {
    unavailable = true;
  }
  const t = themeCopy[lang];
  return (
    <div className="page-container">
      <StructuredData
        data={pageSchema(lang, 'themes', t.themes, t.intro, unavailable ? undefined : rows)}
      />
      <Themes lang={lang} rows={rows} unavailable={unavailable} />
    </div>
  );
}
