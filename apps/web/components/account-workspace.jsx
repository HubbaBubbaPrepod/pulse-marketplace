'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { workspaceCopy } from '../lib/workspace-copy.mjs';
import { Workspace, Status } from './workspace';
import { ModuleArt } from './module-art';
import { accountCopy } from '../lib/account-copy.mjs';
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
export function AccountAuthor({ lang, session, repositories, revisions, capabilities }) {
  const t = accountCopy[lang],
    router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
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
    try {
      const result = await request('/auth/link/github', session, {});
      window.location.assign(result.url);
    } catch {
      setMessage(t.offline);
      setBusy(false);
    }
  }
  return (
    <Workspace lang={lang} section="author" live role={session.user.role}>
      <div className="workspace-body account-workspace">
        <section className="surface account-panel">
          <h2>{t.repo}</h2>
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
              <button className="button" onClick={link} disabled={busy || !capabilities.github}>
                {t.linkGithub}
              </button>
              {!capabilities.github ? (
                <p className="workspace-small">{t.providerUnavailable}</p>
              ) : null}
            </>
          )}
          {message ? <p role="status">{message}</p> : null}
          <h3>{t.repo}</h3>
          {repositories.length ? (
            <ul className="account-repositories">
              {repositories.map((repo) => (
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
        </section>
        <section className="surface account-panel">
          <h2>{t.versions}</h2>
          {revisions.length ? (
            <div className="revision-list">
              {revisions.map((row) => (
                <article className="account-revision" key={row.id}>
                  <ModuleArt id={row.module_id} />
                  <div>
                    <strong>
                      {row.owner}/{row.module_id}
                    </strong>
                    <p>{row.version}</p>
                    <code>{row.sha256}</code>
                    {!row.validation_passed ? <p>{t.checksFailed}</p> : null}
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
                  <ModuleArt id={item.module_id} />
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
                          disabled={
                            busy ||
                            !row.validation_passed ||
                            !session.user.githubId ||
                            session.user.githubId === row.source_owner_id
                          }
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
