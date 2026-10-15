'use client';
import { startTransition, useDeferredValue, useRef, useState } from 'react';
import { Workspace, RevisionFacts, RevisionList } from './workspace';
import { Icon } from './icon';
import { workspaceCopy } from '../lib/workspace-copy.mjs';
import { decideRevision } from '../lib/workspace.mjs';
function Decision({ record, onDecision, lang }) {
  const t = workspaceCopy[lang],
    input = useRef(null);
  const [comment, setComment] = useState(''),
    [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const decision = event.nativeEvent.submitter?.value;
    const result = decideRevision(record, decision, comment);
    if (result.error) {
      setError(result.error);
      input.current.focus();
      return;
    }
    setError('');
    setComment('');
    onDecision(result.revision);
  }
  const terminal = record.status === 'rejected' || record.status === 'withdrawn';
  return (
    <>
      <section className="workspace-section">
        <h3>{t.history}</h3>
        {record.history.length ? (
          <ol className="decision-history">
            {record.history.map((item, i) => (
              <li key={i}>
                <strong>{t[item.decision]}</strong>
                <p>{item.comment}</p>
                <small>{t.sandbox}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p>{t.noHistory}</p>
        )}
      </section>
      {!terminal ? (
        <form className="decision-form" onSubmit={submit} noValidate>
          <label htmlFor="decision-comment">{t.comment}</label>
          <textarea
            ref={input}
            id="decision-comment"
            name="comment"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setError('');
            }}
            maxLength={2000}
            rows={4}
            aria-invalid={Boolean(error)}
            aria-describedby="decision-hint decision-error"
          />
          <p className="workspace-small" id="decision-hint">
            {t.commentHint}
          </p>
          <p id="decision-error" className="workspace-feedback" role="alert">
            {error ? t[`${error}Error`] : ''}
          </p>
          {record.checks.some((check) => !check.passed) ? (
            <p className="workspace-small">{t.checksError}</p>
          ) : null}
          <div className="decision-actions">
            {record.status === 'pending' ? (
              <>
                <button
                  className="button"
                  type="submit"
                  value="approved"
                  disabled={record.checks.some((check) => !check.passed)}
                >
                  <Icon name="check" size={17} />
                  {t.approve}
                </button>
                <button className="button button-outline" type="submit" value="rejected">
                  {t.reject}
                </button>
              </>
            ) : (
              <button className="button button-outline" type="submit" value="withdrawn">
                {t.withdraw}
              </button>
            )}
          </div>
        </form>
      ) : null}
    </>
  );
}
export function Moderation({ lang, initialRecords }) {
  const t = workspaceCopy[lang];
  const [records, setRecords] = useState(initialRecords),
    [filter, setFilter] = useState('pending'),
    [selected, setSelected] = useState(initialRecords[0]?.id),
    [search, setSearch] = useState(''),
    [message, setMessage] = useState('');
  const query = useDeferredValue(search).trim().toLowerCase();
  const visible = records.filter(
    (record) =>
      (filter === 'all' || record.status === filter) &&
      `${record.module} ${record.repository}`.toLowerCase().includes(query),
  );
  const record = visible.find((item) => item.id === selected) || visible[0];
  function update(revision) {
    startTransition(() => {
      setRecords((items) => items.map((item) => (item.id === revision.id ? revision : item)));
      setFilter(revision.status);
      setSelected(revision.id);
      setMessage(t.decisionSaved);
    });
  }
  return (
    <Workspace lang={lang} section="moderation">
      <div className="workspace-stats">
        {['pending', 'approved', 'rejected'].map((status) => (
          <div key={status}>
            <strong>{records.filter((record) => record.status === status).length}</strong>
            <span>
              {t[status]} · {t.example.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
      <div className="workspace-body moderation-layout">
        <section className="surface queue-panel">
          <div className="section-label padded">
            <h2>{t.queue}</h2>
            <Icon name="shield" size={20} />
          </div>
          <div className="queue-toolbar">
            <label className="workspace-search">
              <Icon name="search" size={17} />
              <input
                aria-label={t.search}
                name="queue-search"
                type="search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="sr-only" htmlFor="queue-status">
              {t.review}
            </label>
            <select
              id="queue-status"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setMessage('');
              }}
            >
              {['pending', 'approved', 'rejected', 'withdrawn', 'all'].map((status) => (
                <option key={status} value={status}>
                  {t[status]}
                </option>
              ))}
            </select>
          </div>
          <RevisionList
            records={visible}
            selected={record?.id}
            onSelect={(id) =>
              startTransition(() => {
                setSelected(id);
                setMessage('');
              })
            }
            lang={lang}
          />
          <p className="workspace-small padded">{t.resetNote}</p>
        </section>
        <section className="surface review-panel" aria-label={t.review}>
          <p className="workspace-feedback decision-message" role="status">
            {message}
          </p>
          {record ? (
            <RevisionFacts key={record.id} record={record} lang={lang}>
              <Decision
                key={`${record.id}:${record.status}`}
                record={record}
                onDecision={update}
                lang={lang}
              />
            </RevisionFacts>
          ) : (
            <div className="workspace-empty">
              <Icon name="shield" size={32} />
              <h2>{t.selection}</h2>
            </div>
          )}
        </section>
      </div>
    </Workspace>
  );
}
