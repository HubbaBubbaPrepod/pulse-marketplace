import Link from 'next/link';
import { legal } from '../lib/legal.mjs';
import { pathFor as url } from '../lib/copy.mjs';

export function LegalPage({ lang, document }) {
  const page = legal.documents[document][lang];
  const labels = legal.labels[lang];
  return (
    <article className="legal-page">
      <header className="legal-header">
        <span className="eyebrow">{labels.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        <time dateTime={legal.updated}>{labels.updated}</time>
      </header>
      <div className="legal-layout">
        <aside className="legal-rail">
          <nav aria-label={labels.contents}>
            <h2>{labels.contents}</h2>
            {page.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>
          <nav aria-label={labels.navigation}>
            <h2>{labels.navigation}</h2>
            {Object.entries(legal.documents).map(([key, value]) => (
              <Link
                key={key}
                href={url(lang, key)}
                aria-current={document === key ? 'page' : undefined}
              >
                {value[lang].title}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="legal-body">
          {page.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`heading-${section.id}`}>
              <h2 id={`heading-${section.id}`}>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          {document === 'privacy' ? (
            <section aria-label={lang === 'ru' ? 'Политики провайдеров' : 'Provider policies'}>
              <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
                GitHub Privacy Statement ↗
              </a>
              <a href="https://policies.google.com/privacy">Google Privacy Policy ↗</a>
            </section>
          ) : null}
          <div className="legal-contact">
            <span>{labels.contact}</span>
            <a href="mailto:heyhubbabubbapr@gmail.com">heyhubbabubbapr@gmail.com</a>
            <a href="mailto:support@hubba-cloud.ru">support@hubba-cloud.ru</a>
          </div>
        </div>
      </div>
    </article>
  );
}
