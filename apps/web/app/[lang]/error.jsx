'use client';
import { useParams } from 'next/navigation';
import { Icon } from '../../components/icon';
export default function ErrorBoundary({ reset }) {
  const { lang } = useParams();
  return (
    <div className="page-container">
      <section className="empty-state not-found-state">
        <Icon name="info" size={40} />
        <h1>{lang === 'en' ? 'Could not load this page' : 'Не удалось загрузить страницу'}</h1>
        <p>
          {lang === 'en'
            ? 'Try again. Your theme and filters are preserved.'
            : 'Попробуй ещё раз. Тема и фильтры сохраняются.'}
        </p>
        <button className="button button-outline" onClick={reset}>
          {lang === 'en' ? 'Try again' : 'Повторить'}
          <Icon name="arrow" size={16} />
        </button>
      </section>
    </div>
  );
}
