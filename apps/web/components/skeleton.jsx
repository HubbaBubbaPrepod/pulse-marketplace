import { copy } from '../lib/copy.mjs';
export function CatalogSkeleton({ lang = 'ru' }) {
  return (
    <div
      className="catalog-skeleton"
      role="status"
      aria-label={copy[lang]?.loading || copy.ru.loading}
    >
      <span className="sr-only">{copy[lang]?.loading || copy.ru.loading}</span>
      <div className="skeleton hero-skeleton" />
      <div className="skeleton toolbar-skeleton" />
      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="skeleton skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}
