'use client';
import { ThemePreview } from './theme-preview';
import { themeCopy } from '../lib/theme-catalog.mjs';
import { canApproveRevision } from '../lib/workspace.mjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { workspaceCopy } from '../lib/workspace-copy.mjs';
import { Workspace, Status } from './workspace';
import { ModuleArt } from './module-art';
import { accountCopy } from '../lib/account-copy.mjs';
import { AccountSettings } from './account-settings';
async function request(path, session, body) {
  const response = await fetch(`/api/v1${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers:
      body === undefined
        ? {}
        : { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok) throw Object.assign(new Error(), { status: response.status });
  return response.json();
}
export function AccountAuthor({
  lang,
  session,
  repositories,
  revisions,
  repositoriesCursor = null,
  revisionsCursor = null,
  capabilities,
  account,
  linkStatus,
  mergeStatus,
}) {
  const t = accountCopy[lang],
    router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [moreRepos, setMoreRepos] = useState([]),
    [moreRevisions, setMoreRevisions] = useState([]),
    [repoCursor, setRepoCursor] = useState(repositoriesCursor),
    [revisionCursor, setRevisionCursor] = useState(revisionsCursor),
    [feedback, setFeedback] = useState({}),
    [loadingFeedback, setLoadingFeedback] = useState(null);
  const allRepos = [
    ...new Map([...repositories, ...moreRepos].map((row) => [row.id, row])).values(),
  ];
  const allRevisions = [
    ...new Map([...revisions, ...moreRevisions].map((row) => [row.id, row])).values(),
  ];
  async function loadMore(kind) {
    setBusy(true);
    setMessage('');
    try {
      const page = await request(
        `/author/${kind}?cursor=${encodeURIComponent(kind === 'repositories' ? repoCursor : revisionCursor)}`,
        session,
      );
      if (kind === 'repositories') {
        setMoreRepos((old) => [...old, ...page.items]);
        setRepoCursor(page.nextCursor);
      } else {
        setMoreRevisions((old) => [...old, ...page.items]);
        setRevisionCursor(page.nextCursor);
      }
    } catch {
      setMessage(t.offline);
    } finally {
      setBusy(false);
    }
  }
  async function loadFeedback(id) {
    setLoadingFeedback(id);
    setMessage('');
    try {
      const value = await request(`/author/revisions/${encodeURIComponent(id)}`, session);
      setFeedback((old) => ({ ...old, [id]: value }));
    } catch {
      setMessage(t.offline);
    } finally {
      setLoadingFeedback(null);
    }
  }
  async function submit(event) {
    event.preventDefault();
    const repository = new FormData(event.currentTarget).get('repository');
    setBusy(true);
    setMessage('');
    try {
      await request('/author/repositories', session, { repository });
      setMessage(t.queued);
      router.refresh();
    } catch (error) {
      setMessage(error.status === 404 ? t.ownership : error.status >= 500 ? t.offline : t.invalid);
    } finally {
      setBusy(false);
    }
  }
  async function link() {
    setBusy(true);
    setMessage('');
    try {
      const result = await request('/auth/link/github', session, {});
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error.status === 409 ? t.confirmRequired : t.offline);
      setBusy(false);
    }
  }
  return (
    <Workspace lang={lang} section="author" live role={session.user.role}>
      <div className="workspace-body account-workspace">
        {account ? (
          <AccountSettings
            lang={lang}
            session={session}
            account={account}
            capabilities={capabilities}
            mergeStatus={mergeStatus}
          />
        ) : null}
        <section className="surface account-panel">
          <h2>{t.repo}</h2>
          {linkStatus === 'conflict' || linkStatus === 'failed' ? (
            <p role="alert">
              {linkStatus === 'conflict' ? t.githubAlreadyLinked : t.githubLinkFailed}
            </p>
          ) : linkStatus === 'connected' ? (
            <p role="status">{t.githubLinked}</p>
          ) : null}
          {session.user.githubId ? (
            <form onSubmit={submit} className="auth-fields">
              <label>
                {t.addHint}
                <input name="repository" placeholder={t.repoPlaceholder} required maxLength={180} />
              </label>
              <button className="button" disabled={busy}>
                {busy ? t.busy : t.add}
              </button>
            </form>
          ) : (
            <>
              <p>{t.githubRequired}</p>
              <button
                type="button"
                className="button"
                onClick={link}
                disabled={busy || !capabilities.github}
                aria-busy={busy}
              >
                {busy ? t.busy : t.linkGithub}
              </button>
              {!capabilities.github ? (
                <p className="workspace-small">{t.providerUnavailable}</p>
              ) : null}
            </>
          )}
          {message ? <p role="status">{message}</p> : null}
          <h3>{t.repo}</h3>
          {allRepos.length ? (
            <ul className="account-repositories">
              {allRepos.map((repo) => (
                <li key={repo.id}>
                  <a
                    href={`https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {repo.owner}/{repo.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t.noRepos}</p>
          )}
          {repoCursor ? (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => loadMore('repositories')}
            >
              {busy ? t.busy : t.loadMore}
            </button>
          ) : null}
        </section>
        <section className="surface account-panel">
          <h2>{t.versions}</h2>
          {allRevisions.length ? (
            <div className="revision-list">
              {allRevisions.map((row) => (
                <article className="account-revision" key={row.id}>
                  <ModuleArt id={row.module_id} />
                  <div>
                    <strong>
                      {row.owner}/{row.module_id}
                    </strong>
                    <p>{row.version}</p>
                    <code>{row.sha256}</code>
                    {!row.validation_passed ? <p>{t.checksFailed}</p> : null}
                    <details
                      onToggle={(event) => {
                        if (
                          event.currentTarget.open &&
                          !feedback[row.id] &&
                          loadingFeedback !== row.id
                        )
                          void loadFeedback(row.id);
                      }}
                    >
                      <summary>{t.reviewDetails}</summary>
                      {loadingFeedback === row.id ? <p role="status">{t.busy}</p> : null}
                      {feedback[row.id] ? (
                        <>
                          {feedback[row.id].revision.validation_issues?.length ? (
                            <ul>
                              {feedback[row.id].revision.validation_issues.map((issue, index) => (
                                <li key={index}>
                                  <code>
                                    {issue.path}: {issue.code}
                                  </code>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>{t.checksPassed}</p>
                          )}
                          <h4>{t.history}</h4>
                          {feedback[row.id].history.length ? (
                            feedback[row.id].history.map((entry, index) => (
                              <div key={index}>
                                <small>
                                  {new Intl.DateTimeFormat(lang, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  }).format(new Date(entry.created_at))}{' '}
                                  · {entry.action}
                                </small>
                                <p>{entry.comment}</p>
                              </div>
                            ))
                          ) : (
                            <p>{t.noDecisions}</p>
                          )}
                        </>
                      ) : null}
                    </details>
                  </div>
                  <Status lang={lang} status={row.status} />
                </article>
              ))}
            </div>
          ) : (
            <div className="workspace-empty">
              <h3>{t.noModules}</h3>
              <p>{t.noModulesText}</p>
            </div>
          )}
          {revisionCursor ? (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => loadMore('revisions')}
            >
              {busy ? t.busy : t.loadMore}
            </button>
          ) : null}
        </section>
      </div>
    </Workspace>
  );
}
export function AccountModeration({ lang, session, records, status = 'pending', nextCursor }) {
  const [extra, setExtra] = useState([]),
    [cursor, setCursor] = useState(nextCursor);
  const t = accountCopy[lang],
    router = useRouter(),
    [selected, setSelected] = useState(null),
    [detail, setDetail] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function select(id) {
    setSelected(id);
    setDetail(null);
    setMessage('');
    setBusy(true);
    try {
      setDetail(await request(`/moderation/revisions/${id}`, session));
    } catch {
      setMessage(t.offline);
    } finally {
      setBusy(false);
    }
  }
  async function decide(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    try {
      await request(`/moderation/revisions/${selected}/decision`, session, {
        expectedSha256: detail.revision.sha256,
        action: event.nativeEvent.submitter.value,
        comment: form.get('comment'),
      });
      setDetail(await request(`/moderation/revisions/${selected}`, session));
      setMessage(t.decisionDone);
      router.refresh();
    } catch (error) {
      setMessage(
        error.status === 403
          ? t.linkRequired
          : error.status === 409
            ? lang === 'ru'
              ? 'Версия уже изменилась. Открой её заново.'
              : 'This revision changed. Open it again.'
            : error.status >= 500
              ? t.offline
              : t.invalid,
      );
    } finally {
      setBusy(false);
    }
  }
  const row = detail?.revision;
  async function more() {
    setBusy(true);
    try {
      const page = await request(
        `/moderation/revisions?status=${status}&cursor=${encodeURIComponent(cursor)}`,
        session,
      );
      setExtra((old) => [...old, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      setMessage(t.offline);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace lang={lang} section="moderation" live role={session.user.role}>
      <div className="workspace-body account-workspace">
        <section className="surface account-panel">
          <h2>{t.versions}</h2>
          <nav className="account-actions" aria-label={t.moderation}>
            {['pending', 'approved', 'rejected', 'withdrawn'].map((state) => (
              <Link
                className="platform-tag"
                key={state}
                href={`/${lang}/moderation/?status=${state}`}
                aria-current={state === status ? 'page' : undefined}
              >
                {workspaceCopy[lang][state]}
              </Link>
            ))}
          </nav>
          {records.length ? (
            <div className="revision-list">
              {[...records, ...extra].map((item) => (
                <button
                  className="revision-row"
                  key={item.id}
                  aria-pressed={selected === item.id}
                  onClick={() => select(item.id)}
                  disabled={busy}
                >
                  {item.kind === 'theme' ? (
                    <span className="revision-theme-label">{themeCopy[lang].themes}</span>
                  ) : (
                    <ModuleArt id={item.module_id} />
                  )}
                  <span className="revision-label">
                    <strong>
                      {item.owner}/{item.module_id}
                    </strong>
                    <small>{item.version}</small>
                  </span>
                  <Status lang={lang} status={item.status} />
                </button>
              ))}
            </div>
          ) : (
            <div className="workspace-empty">
              <h3>{t.noQueue}</h3>
              <p>{t.noQueueText}</p>
            </div>
          )}
          {cursor ? (
            <button className="button button-outline" onClick={more} disabled={busy}>
              {lang === 'ru' ? 'Загрузить ещё' : 'Load more'}
            </button>
          ) : null}
        </section>
        <section className="surface account-panel" aria-busy={busy}>
          {busy && !row ? <p role="status">{t.busy}</p> : null}
          {row ? (
            <>
              <h2>
                {row.owner}/{row.module_id} <small>{row.version}</small>
              </h2>
              <Status lang={lang} status={row.status} />
              <dl className="revision-metadata">
                <div>
                  <dt>{t.digest}</dt>
                  <dd>
                    <code>{row.sha256}</code>
                  </dd>
                </div>
                <div>
                  <dt>Commit</dt>
                  <dd>
                    <code>{row.commit_sha}</code>
                  </dd>
                </div>
                <div>
                  <dt>{t.source}</dt>
                  <dd>
                    <a href={row.source_url} rel="noreferrer" target="_blank">
                      GitHub ↗
                    </a>
                  </dd>
                </div>
              </dl>
              <p>{row.manifest.description}</p>
              {row.manifest.kind === 'theme' ? (
                <>
                  <h3>{themeCopy[lang].preview}</h3>
                  <ThemePreview theme={row.manifest.theme} lang={lang} />
                  <p>{themeCopy[lang].safe}</p>
                </>
              ) : (
                <h3>{t.executionRuntime}</h3>
              )}
              {row.manifest.kind === 'theme' ? null : row.manifest.components?.length ? (
                row.manifest.components.map((component) => (
                  <div key={component.id}>
                    <strong>
                      {component.id} · {component.location} ·{' '}
                      {component.runtime === 'wasip1' ? t.wasiRuntime : t.nativeRuntime}
                    </strong>
                    <p>{component.runtime === 'wasip1' ? t.wasiWarning : t.nativeWarning}</p>
                    <p>
                      {t.brokerCapabilities}:{' '}
                      {[
                        ...(component.requires ?? []),
                        ...(component.optionalCapabilities ?? []),
                      ].join(', ') || '—'}
                    </p>
                  </div>
                ))
              ) : (
                <p>{t.nativeWarning}</p>
              )}
              <h3>{t.permissions}</h3>
              <ul>
                {(row.manifest.permissions || []).map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
              {!row.validation_passed ? (
                <>
                  <p>{t.checksFailed}</p>
                  <ul>
                    {row.validation_issues.map((issue, index) => (
                      <li key={index}>
                        <code>
                          {issue.path}: {issue.code}
                        </code>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p className="workspace-small">{t.reviewNote}</p>
              {row.status === 'pending' || row.status === 'approved' ? (
                <form className="auth-fields" onSubmit={decide}>
                  <label>
                    {t.comment}
                    <textarea
                      name="comment"
                      placeholder={t.commentPlaceholder}
                      required
                      maxLength={2000}
                      rows={4}
                    />
                  </label>
                  <div className="account-actions">
                    {row.status === 'pending' ? (
                      <>
                        <button
                          className="button"
                          name="action"
                          value="approve"
                          disabled={busy || !canApproveRevision(session.user, row)}
                        >
                          {t.approve}
                        </button>
                        <button
                          className="button button-outline"
                          name="action"
                          value="reject"
                          disabled={busy}
                        >
                          {t.reject}
                        </button>
                      </>
                    ) : (
                      <button
                        className="button button-outline"
                        name="action"
                        value="withdraw"
                        disabled={busy}
                      >
                        {t.withdraw}
                      </button>
                    )}
                  </div>
                </form>
              ) : null}
              <h3>{t.history}</h3>
              {detail.history.map((event, index) => (
                <article className="audit-entry" key={index}>
                  <strong>{event.action}</strong>
                  <time>
                    {new Intl.DateTimeFormat(lang, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(event.created_at))}
                  </time>
                  <p>{event.comment}</p>
                </article>
              ))}
            </>
          ) : null}
          {message ? <p role="status">{message}</p> : null}
        </section>
      </div>
    </Workspace>
  );
}
