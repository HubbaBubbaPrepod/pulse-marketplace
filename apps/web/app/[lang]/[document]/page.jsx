import { notFound } from 'next/navigation';
import { LegalPage } from '../../../components/legal-page';
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
  const origin = 'https://marketplace.hubba-cloud.ru';
  return {
    title: page.title,
    description: page.description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${origin}/${lang}/${document}/`,
      languages: {
        ru: `${origin}/ru/${document}/`,
        en: `${origin}/en/${document}/`,
      },
    },
  };
}

export default async function Page({ params }) {
  const { lang, document } = await params;
  if (!Object.hasOwn(legal.documents, document) || !legal.documents[document][lang]) notFound();
  return <LegalPage lang={lang} document={document} />;
}
