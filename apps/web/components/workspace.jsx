'use client';
import Link from 'next/link';
import { useRef, ViewTransition } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Icon } from './icon';
import { ModuleArt } from './module-art';
import { pathFor } from '../lib/copy.mjs';
import { workspaceCopy } from '../lib/workspace-copy.mjs';
gsap.registerPlugin(useGSAP);

export function Workspace({ lang, section, children, live = false, role = 'author' }) {
  const scope = useRef(null),
    t = workspaceCopy[lang];
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          gsap.from('.workspace-heading > *, .workspace-stats, .workspace-body', {
            y: 14,
            opacity: 0,
            duration: 0.45,
            stagger: 0.055,
            ease: 'power2.out',
            clearProps: 'all',
          });
        },
        scope,
      );
      return () => mm.revert();
    },
    { scope },
  );
  return (
    <ViewTransition enter="auto" exit="auto" default="none">
      <div className="workspace" ref={scope}>
        <nav className="workspace-nav" aria-label={live ? t.author : t.workspace}>
          <Link
            href={pathFor(lang, 'author')}
            aria-current={section === 'author' ? 'page' : undefined}
          >
            <Icon name="terminal" size={17} />
            {t.author}
          </Link>
          {!live || ['moderator', 'administrator'].includes(role) ? (
            <Link
              href={pathFor(lang, 'moderation')}
              aria-current={section === 'moderation' ? 'page' : undefined}
            >
              <Icon name="shield" size={17} />
              {t.moderation}
            </Link>
          ) : null}
          {!live ? <span>{t.sandbox}</span> : null}
        </nav>
        <header className="workspace-heading">
          <span className="eyebrow">
            PULSE / {section === 'author' ? 'CONTRIBUTORS' : 'REVIEW'}
          </span>
          <h1>{section === 'author' ? t.authorTitle : t.moderatorTitle}</h1>
          <p>{section === 'author' ? t.authorSubtitle : t.moderatorSubtitle}</p>
        </header>
        {!live ? (
          <div className="workspace-notice">
            <Icon name="info" size={20} />
            <p>{t.sandboxText}</p>
          </div>
        ) : null}
        {children}
      </div>
    </ViewTransition>
  );
}
export function Status({ status, lang }) {
  return (
    <span className={`workspace-status status-${status}`}>
      <Icon
        name={status === 'approved' ? 'check' : status === 'pending' ? 'clock' : 'info'}
        size={14}
      />
      {workspaceCopy[lang][status]}
    </span>
  );
}
export function RevisionList({ records, selected, onSelect, lang }) {
  const t = workspaceCopy[lang];
  return (
    <div className="revision-list">
      {records.length ? (
        records.map((record) => (
          <button
            type="button"
            className="revision-row"
            key={record.id}
            aria-pressed={selected === record.id}
            onClick={() => onSelect(record.id)}
            aria-controls="revision-detail"
          >
            <ModuleArt id={record.art} />
            <span className="revision-label">
              <strong>{record.module}</strong>
              <small>{record.repository}</small>
            </span>
            <span className="revision-state">
              <span className="revision-example">{t.example}</span>
              <Status status={record.status} lang={lang} />
            </span>
            <Icon name="arrow" size={18} />
          </button>
        ))
      ) : (
        <div className="workspace-empty">
          <Icon name="search" size={26} />
          <h3>{t.empty}</h3>
          <p>{t.emptyText}</p>
        </div>
      )}
    </div>
  );
}
export function RevisionFacts({ record, lang, children }) {
  const t = workspaceCopy[lang];
  return (
    <div id="revision-detail" className="revision-detail">
      <div className="revision-detail-heading">
        <ModuleArt id={record.art} />
        <div>
          <span className="eyebrow">{t.example}</span>
          <h2>{record.module}</h2>
          <Status status={record.status} lang={lang} />
        </div>
      </div>
      <dl className="revision-metadata">
        <div>
          <dt>{t.revision}</dt>
          <dd translate="no">{record.id}</dd>
        </div>
        <div>
          <dt>{t.source}</dt>
          <dd>
            {record.source ? (
              <a href={record.source} target="_blank" rel="noreferrer">
                {record.repository}
                <Icon name="external" size={14} />
              </a>
            ) : (
              record.repository
            )}
          </dd>
        </div>
      </dl>
      <p className="workspace-small">
        <Icon name="lock" size={14} />
        {t.unpinned}
      </p>
      <div className="revision-platforms">
        {record.platforms.map((platform) => (
          <span className="platform-tag" key={platform}>
            {platform}
          </span>
        ))}
      </div>
      <section className="workspace-section">
        <h3>{t.checks}</h3>
        <ul className="check-ledger">
          {record.checks.map((check, i) => (
            <li key={i}>
              <Icon name={check.passed ? 'check' : 'close'} size={18} />
              <span>{t.checkNames[i]}</span>
              <small>{check.passed ? t.pass : t.fail}</small>
            </li>
          ))}
        </ul>
      </section>
      <section className="workspace-section">
        <h3>{t.access}</h3>
        <p>{t[record.access]}</p>
      </section>
      <details className="workspace-changes">
        <summary>
          {t.changes}
          <Icon name="chevron" size={16} />
        </summary>
        <p>{t.changesText}</p>
      </details>
      {children}
    </div>
  );
}
