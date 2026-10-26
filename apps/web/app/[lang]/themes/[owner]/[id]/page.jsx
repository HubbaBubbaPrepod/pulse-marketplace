import { notFound } from 'next/navigation';
import { cache } from 'react';
import { api, ApiError } from '../../../../../lib/server-api';
import { ThemeDetail } from '../../../../../components/themes';
import { themeCopy } from '../../../../../lib/theme-catalog.mjs';
import { publicMetadata, pageSchema } from '../../../../../lib/seo.mjs';
import { StructuredData } from '../../../../../components/structured-data';
const load = cache(async (owner, id) => {
  try {
    return await api(`/themes/${encodeURIComponent(owner)}/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});
export async function generateMetadata({ params }) {
  const { lang, owner, id } = await params;
  if (!themeCopy[lang]) return {};
  const { theme } = await load(owner, id);
  return publicMetadata(
    lang,
    `themes/${encodeURIComponent(owner)}/${encodeURIComponent(id)}`,
    theme.name,
    theme.description || themeCopy[lang].intro,
  );
}
export default async function Page({ params }) {
  const { lang, owner, id } = await params;
  if (!themeCopy[lang]) notFound();
  const { theme, versions } = await load(owner, id);
  return (
    <div className="page-container">
      <StructuredData
        data={pageSchema(
          lang,
          `themes/${encodeURIComponent(owner)}/${encodeURIComponent(id)}`,
          theme.name,
          theme.description,
        )}
      />
      <ThemeDetail lang={lang} row={theme} versions={versions} />
    </div>
  );
}
