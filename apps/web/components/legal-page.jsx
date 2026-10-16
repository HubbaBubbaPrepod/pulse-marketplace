import Link from 'next/link';
import { legal } from '../lib/legal.mjs';
import { pathFor as url } from '../lib/copy.mjs';

function LegalText({ paragraph, lang }) {
  if (typeof paragraph === 'string') return paragraph;
  return paragraph.map((part, index) =>
    typeof part === 'string' ? (
      part
    ) : (
      <Link key={index} href={part.document ? url(lang, part.document) : part.href}>
        {part.text}
      </Link>
    ),
  );
}

export function LegalPage({ lang, document }) {
  const page = legal.documents[document][lang];
  const labels = legal.labels[lang];
  const operator = legal.operator[lang];
  return (
    <article className="legal-page">
      <header className="legal-header">
        <span className="eyebrow">{labels.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        <time dateTime={legal.updated}>{labels.updated}</time>
      </header>
      {page.showOperator ? (
        <section className="legal-requisites" aria-label={operator.title}>
          <h2>{operator.title}</h2>
          <p className="legal-operator-name">{operator.name}</p>
          <p className="legal-operator-status">{operator.status}</p>
          <dl>
            <div>
              <dt>{operator.taxLabel}</dt>
              <dd>{legal.operator.taxId}</dd>
            </div>
            <div>
              <dt>{operator.addressLabel}</dt>
              <dd>{operator.address}</dd>
            </div>
            <div>
              <dt>{lang === 'ru' ? 'Электронная почта' : 'Email'}</dt>
              <dd>
                <a href={`mailto:${legal.operator.supportEmail}`}>{legal.operator.supportEmail}</a>
              </dd>
            </div>
            <div>
              <dt>{operator.contactLabel}</dt>
              <dd>
                <a href={`mailto:${legal.operator.privacyEmail}`}>{legal.operator.privacyEmail}</a>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
      <div className="legal-layout">
        <aside className="legal-rail">
          <nav aria-label={labels.contents}>
            <h2>{labels.contents}</h2>
            {page.sections.map((section, sectionIndex) => (
              <a key={section.id} href={`#${section.id}`}>
                {page.numbered ? `${sectionIndex + 1}. ` : ''}
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
          {page.sections.map((section, sectionIndex) => (
            <section key={section.id} id={section.id} aria-labelledby={`heading-${section.id}`}>
              <h2 id={`heading-${section.id}`}>
                {page.numbered ? `${sectionIndex + 1}. ` : ''}
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className={page.numbered ? 'legal-clause' : undefined}>
                  {page.numbered ? (
                    <>
                      <span className="legal-clause-number">
                        {sectionIndex + 1}.{paragraphIndex + 1}.
                      </span>
                      <span>
                        <LegalText paragraph={paragraph} lang={lang} />
                      </span>
                    </>
                  ) : (
                    <LegalText paragraph={paragraph} lang={lang} />
                  )}
                </p>
              ))}
            </section>
          ))}
          {document === 'privacy' ? (
            <section aria-label={lang === 'ru' ? 'Политики провайдеров' : 'Provider policies'}>
              <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
                GitHub Privacy Statement ↗
              </a>
              <a href="https://policies.google.com/privacy">Google Privacy Policy ↗</a>
              <a href="https://myaccount.google.com/connections">
                {lang === 'ru'
                  ? 'Управлять подключениями Google'
                  : 'Manage Google Account connections'}{' '}
                ↗
              </a>
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
