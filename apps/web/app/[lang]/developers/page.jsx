import { notFound } from 'next/navigation';
import { Developers } from '../../../components/developers';
import { publicMetadata, pageSchema, seoCopy } from '../../../lib/seo.mjs';
import { StructuredData } from '../../../components/structured-data';
export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!seoCopy[lang]) return {};
  return publicMetadata(
    lang,
    'developers',
    seoCopy[lang].developersTitle,
    seoCopy[lang].developersDescription,
  );
}
export default async function Page({ params }) {
  const { lang } = await params;
  if (!seoCopy[lang]) notFound();
  return (
    <div className="page-container">
      <StructuredData
        data={pageSchema(
          lang,
          'developers',
          seoCopy[lang].developersTitle,
          seoCopy[lang].developersDescription,
        )}
      />
      <Developers lang={lang} />
    </div>
  );
}
