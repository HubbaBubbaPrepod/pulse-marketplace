'use client';
import Link from 'next/link';
import { startTransition, useRef, useState, useSyncExternalStore } from 'react';
import { Workspace, RevisionFacts, RevisionList } from './workspace';
import { Icon } from './icon';
import { pathFor } from '../lib/copy.mjs';
import { workspaceCopy } from '../lib/workspace-copy.mjs';
import { parseRepository, restoreDrafts } from '../lib/workspace.mjs';
const storageKey = 'pulse-market.repository-drafts.v1';
function subscribe(fn) {
  const storage = (event) => {
    if (event.key === storageKey || event.key === null) fn();
  };
  window.addEventListener('storage', storage);
  window.addEventListener('pulse-market-drafts', fn);
  return () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener('pulse-market-drafts', fn);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}
const serverSnapshot = () => null;
export function Author({ lang, records }) {
  const t = workspaceCopy[lang],
    input = useRef(null);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [memoryDrafts, setMemoryDrafts] = useState(null),
    [value, setValue] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(records[0]?.id);
  const drafts = memoryDrafts ?? restoreDrafts(raw),
    record = records.find((item) => item.id === selected);
  function save(event) {
    event.preventDefault();
    const repository = parseRepository(value);
    const issue = !repository
      ? 'invalid'
      : drafts.some((item) => item.key === repository.key)
        ? 'duplicate'
        : drafts.length >= 50
          ? 'limit'
          : '';
    setError(issue);
    setMessage('');
    if (issue) {
      input.current.focus();
      return;
    }
    const next = [...drafts, repository];
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, drafts: next }));
      window.dispatchEvent(new Event('pulse-market-drafts'));
      setMemoryDrafts(null);
      setMessage('saved');
    } catch {
      setMemoryDrafts(next);
      setMessage('storageError');
    }
    setValue('');
  }
  return (
    <Workspace lang={lang} section="author">
      <div className="workspace-stats">
        <div>
          <strong>{drafts.length}</strong>
          <span>{t.drafts}</span>
        </div>
        <div>
          <strong>{records.length}</strong>
          <span>{t.examples}</span>
        </div>
        <div>
          <strong>{records.filter((item) => item.status === 'pending').length}</strong>
          <span>
            {t.pending} · {t.example.toLowerCase()}
          </span>
        </div>
      </div>
      <div className="workspace-body author-layout">
        <div className="workspace-main">
          <section className="surface repository-form" id="add-repository">
            <div className="section-label">
              <Icon name="github" size={21} />
              <h2>{t.add}</h2>
            </div>
            <form onSubmit={save} noValidate>
              <label htmlFor="repository-url">{t.repository}</label>
              <div className="repository-input-row">
                <input
                  ref={input}
                  id="repository-url"
                  name="repository"
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setError('');
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'repository-error repository-hint' : 'repository-hint'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="github.com/owner/repository"
                  maxLength={250}
                />
                <button className="button" type="submit">
                  {t.save}
                  <Icon name="arrow" size={17} />
                </button>
              </div>
              <p id="repository-hint" className="workspace-small">
                {t.repoHint}
              </p>
              <p id="repository-error" className="workspace-feedback" role="alert">
                {error ? t[error] : ''}
              </p>
              <p className="workspace-feedback" role="status">
                {message ? t[message] : ''}
              </p>
            </form>
          </section>
          <section className="surface draft-section">
            <div className="section-label">
              <h2>{t.repositories}</h2>
              <span className="workspace-small">
                <Icon name="lock" size={14} />
                {t.local}
              </span>
            </div>
            {drafts.length ? (
              <ul className="draft-list">
                {drafts.map((draft) => (
                  <li key={draft.key}>
                    <Icon name="github" size={21} />
                    <div>
                      <strong translate="no">{draft.name}</strong>
                      <small>{t.notSent}</small>
                    </div>
                    <a
                      className="icon-button"
                      href={draft.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${t.openSource}: ${draft.name}`}
                    >
                      <Icon name="external" size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="workspace-empty">
                <Icon name="box" size={28} />
                <h3>{t.draftEmpty}</h3>
                <p>{t.draftEmptyText}</p>
              </div>
            )}
            <p className="workspace-small">{t.localOnly}</p>
          </section>
          <section className="surface">
            <div className="section-label padded">
              <h2>{t.versions}</h2>
              <span className="revision-example">{t.examples}</span>
            </div>
            <RevisionList
              records={records}
              selected={selected}
              onSelect={(id) => startTransition(() => setSelected(id))}
              lang={lang}
            />
          </section>
        </div>
        <aside className="workspace-aside">
          <section className="surface preparation">
            <h2>{t.preparation}</h2>
            <ol>
              {t.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Link className="back-link" href={pathFor(lang, 'developers')}>
              {t.docs}
              <Icon name="arrow" size={16} />
            </Link>
          </section>
          {record ? (
            <section className="surface" aria-label={t.review}>
              <RevisionFacts key={record.id} record={record} lang={lang}>
                {record.status === 'rejected' ? (
                  <div className="version-feedback">
                    <h3>{t.feedback}</h3>
                    <p>{t.feedbackText}</p>
                  </div>
                ) : null}
              </RevisionFacts>
            </section>
          ) : null}
        </aside>
      </div>
    </Workspace>
  );
}
