import Link from 'next/link';
import { themeCopy } from '../lib/theme-catalog.mjs';
export function CatalogNavigation({ lang, active = 'modules' }) {
  const t = themeCopy[lang];
  return (
    <nav
      className="catalog-kinds"
      aria-label={lang === 'ru' ? 'Разделы каталога' : 'Catalog sections'}
    >
      <Link href={`/${lang}/`} aria-current={active === 'modules' ? 'page' : undefined}>
        {t.modules}
      </Link>
      <Link href={`/${lang}/themes/`} aria-current={active === 'themes' ? 'page' : undefined}>
        {t.themes}
      </Link>
    </nav>
  );
}
