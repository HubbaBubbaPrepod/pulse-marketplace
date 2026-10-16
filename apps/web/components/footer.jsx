import { legal } from '../lib/legal.mjs';
import Link from 'next/link';
import { Icon } from './icon';
import { copy, pathFor } from '../lib/copy.mjs';
export function AuthorCallout({ lang }) {
  const t = copy[lang];
  return (
    <section className="author-callout">
      <div>
        <Icon name="github" size={26} />
        <p>
          <strong>{t.authorCta}</strong> {t.authorIntro}
        </p>
      </div>
      <Link className="button button-outline" href={pathFor(lang, 'developers')}>
        {t.authorLink}
        <Icon name="arrow" size={17} />
      </Link>
    </section>
  );
}
export function Footer({ lang }) {
  const t = copy[lang];
  return (
    <footer className="site-footer">
      <div>
        <span className="footer-brand">PULSE / MARKETPLACE</span>
        <p>{t.footer}</p>
      </div>
      <nav aria-label={lang === 'ru' ? 'Ссылки проекта' : 'Project links'}>
        <a
          href={`https://pulse.hubba-cloud.ru/${lang === 'en' ? 'en/' : ''}`}
          target="_blank"
          rel="noreferrer"
        >
          {t.landing}
          <Icon name="external" size={13} />
        </a>
        <a
          href="https://github.com/HubbaBubbaPrepod/pulse-monitor"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
          <Icon name="external" size={13} />
        </a>
        {Object.entries(legal.documents).map(([key, value]) => (
          <Link key={key} href={pathFor(lang, key)}>
            {value[lang].title}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
