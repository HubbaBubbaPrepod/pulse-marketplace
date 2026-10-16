import { notFound } from 'next/navigation';
import { LegalPage } from '../../../components/legal-page';
import { publicMetadata, pageSchema } from '../../../lib/seo.mjs';
import { StructuredData } from '../../../components/structured-data';
import { legal } from '../../../lib/legal.mjs';

export const dynamicParams = false;
export function generateStaticParams() {
  return ['ru', 'en'].flatMap((lang) =>
    Object.keys(legal.documents).map((document) => ({ lang, document })),
  );
}

export async function generateMetadata({ params }) {
  const { lang, document } = await params;
  const page = Object.hasOwn(legal.documents, document) ? legal.documents[document][lang] : null;
  if (!page) return {};
  return publicMetadata(lang, document, page.title, page.description);
}

export default async function Page({ params }) {
  const { lang, document } = await params;
  if (!Object.hasOwn(legal.documents, document) || !legal.documents[document][lang]) notFound();
  const page = legal.documents[document][lang];
  return (
    <>
      <StructuredData data={pageSchema(lang, document, page.title, page.description)} />
      <LegalPage lang={lang} document={document} />
    </>
  );
}
