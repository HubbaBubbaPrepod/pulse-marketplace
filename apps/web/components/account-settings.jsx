'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountCopy } from '../lib/account-copy.mjs';

export function AccountSettings({ lang, session, account, capabilities, mergeStatus }) {
  const t = accountCopy[lang],
    router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [fresh, setFresh] = useState(account.fresh),
    [intent, setIntent] = useState(null),
    [confirmation, setConfirmation] = useState('');
  async function send(path, body) {
    const response = await fetch('/api/v1/auth/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!response.ok) throw Object.assign(new Error(), { status: response.status });
    return response.json();
  }
  async function run(action) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      if (error.status === 409) setFresh(false);
      setMessage(
        error.status === 409 ? t.accountConflict : error.status === 401 ? t.credentials : t.offline,
      );
    } finally {
      setBusy(false);
    }
  }
  async function provider(name, merge = false) {
    await run(async () => {
      const result = await send((merge ? 'account/merge/' : 'link/') + name, { lang });
      window.location.assign(result.url);
    });
  }
  async function verify(event) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    const form = event.currentTarget;
    await run(async () => {
      await send('account/confirm', { password });
      setFresh(true);
      setMessage(t.accountVerified);
      form.reset();
    });
  }
  async function apply(event) {
    event.preventDefault();
    await run(async () => {
      await send('account/' + intent.type, { confirmation, provider: intent.provider });
      if (intent.type === 'delete') {
        window.dispatchEvent(new Event('pulse-session'));
        router.replace(`/${lang}/login/`);
        router.refresh();
        return;
      }
      if (intent.type === 'merge/confirm') {
        window.dispatchEvent(new Event('pulse-session'));
        router.replace(`/${lang}/author/?merge=done`);
        router.refresh();
        return;
      }
      setIntent(null);
      setConfirmation('');
      setMessage(t.accountSaved);
      router.refresh();
    });
  }
  const word =
    intent?.type === 'delete' ? 'DELETE' : intent?.type === 'merge/confirm' ? 'MERGE' : 'UNLINK';
  return (
    <section className="surface account-panel">
      <h2>{t.accountSettings}</h2>
      <p>{t.accountSafety}</p>
      {mergeStatus === 'failed' ? (
        <p role="alert">{t.mergeConflict}</p>
      ) : mergeStatus === 'done' ? (
        <p role="status">{t.mergeDone}</p>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
      <ul className="account-repositories">
        {['github', 'google'].map((name) => (
          <li key={name}>
            <strong>{name === 'github' ? 'GitHub' : 'Google'}</strong> ·{' '}
            {account.providers.includes(name) ? t.connected : t.notConnected}{' '}
            {capabilities[name] ? (
              <button
                className="button button-outline"
                disabled={busy}
                onClick={() => provider(name)}
              >
                {account.providers.includes(name) ? t.confirmProvider : t.connectProvider}
              </button>
            ) : null}{' '}
            {account.providers.includes(name) ? (
              <button
                className="button button-outline"
                disabled={busy || !fresh}
                onClick={() => {
                  setIntent({ type: 'unlink', provider: name });
                  setConfirmation('');
                }}
              >
                {t.unlinkProvider}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {account.password ? (
        <form className="auth-fields" onSubmit={verify}>
          <label>
            {t.password}
            <input
              name="password"
              type="password"
              required
              maxLength={1024}
              autoComplete="current-password"
              placeholder={t.passwordPlaceholder}
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? t.busy : t.confirmAccount}
          </button>
        </form>
      ) : null}
      <p role="status">{fresh ? t.accountVerified : t.confirmRequired}</p>
      {session.user.role === 'author' ? (
        <>
          <h3>{t.mergeAccounts}</h3>
          <p>{t.mergeExplanation}</p>
          <div className="account-actions">
            {['github', 'google']
              .filter((name) => capabilities[name])
              .map((name) => (
                <button
                  key={name}
                  className="button button-outline"
                  disabled={busy || !fresh}
                  onClick={() => provider(name, true)}
                >
                  {t.verifyOther} {name === 'github' ? 'GitHub' : 'Google'}
                </button>
              ))}
          </div>
          {account.merge ? (
            <div role="status">
              <p>
                {t.mergeReady} <strong>{account.merge.displayName}</strong>
              </p>
              <button
                className="button"
                disabled={busy || !fresh}
                onClick={() => {
                  setIntent({ type: 'merge/confirm' });
                  setConfirmation('');
                }}
              >
                {t.mergeAccounts}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
      <button
        className="button button-outline"
        disabled={busy || !fresh}
        onClick={() => {
          setIntent({ type: 'delete' });
          setConfirmation('');
        }}
      >
        {t.deleteAccount}
      </button>
      {intent ? (
        <form className="auth-fields" onSubmit={apply}>
          <p>
            {intent.type === 'delete'
              ? t.deleteWarning
              : intent.type === 'merge/confirm'
                ? t.mergeWarning
                : t.unlinkWarning}
          </p>
          <label>
            {t.typeConfirmation} {word}
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              maxLength={10}
              required
            />
          </label>
          <div className="account-actions">
            <button className="button" disabled={busy || confirmation !== word}>
              {busy ? t.busy : t.confirmAction}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setIntent(null)}
              disabled={busy}
            >
              {t.cancelAction}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
