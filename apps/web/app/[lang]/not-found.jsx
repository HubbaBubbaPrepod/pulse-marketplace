'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { copy, pathFor } from '../../lib/copy.mjs';
import { Icon } from '../../components/icon';
export default function NotFound() {
  const params = useParams(),
    lang = params.lang === 'en' ? 'en' : 'ru',
    t = copy[lang];
  return (
    <div className="page-container">
      <section className="empty-state not-found-state">
        <Icon name="box" size={40} />
        <h1>{t.notFound}</h1>
        <p>{t.notFoundText}</p>
        <Link className="button button-outline" href={pathFor(lang)}>
          {t.back}
          <Icon name="arrow" size={16} />
        </Link>
      </section>
    </div>
  );
}
