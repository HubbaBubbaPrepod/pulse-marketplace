'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountCopy } from '../lib/account-copy.mjs';
export function SessionMenu({ lang }) {
  const t = accountCopy[lang],
    router = useRouter();
  const [session, setSession] = useState(null),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetch('/api/v1/auth/session', { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error();
          return response.json();
        })
        .then((value) => {
          if (active) {
            setSession(value);
            setFailed(false);
          }
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    };
    refresh();
    window.addEventListener('pulse-session', refresh);
    return () => {
      active = false;
      window.removeEventListener('pulse-session', refresh);
    };
  }, []);
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
        body: '{}',
      });
      if (!response.ok) throw new Error();
      setSession({ user: null });
      router.replace(`/${lang}/`);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  if (!session && !failed) return <span className="session-loading" aria-label={t.checking} />;
  if (!session?.user)
    return (
      <Link className="button button-outline login-link" href={`/${lang}/login/`}>
        {t.login}
      </Link>
    );
  return (
    <details className="session-menu">
      <summary className="button button-outline">{session.user.displayName}</summary>
      <div className="surface session-dropdown">
        <Link href={`/${lang}/author/`}>{t.dashboard}</Link>
        {['moderator', 'administrator'].includes(session.user.role) ? (
          <Link href={`/${lang}/moderation/`}>{t.moderation}</Link>
        ) : null}
        <button disabled={busy} onClick={logout}>
          {t.logout}
        </button>
        {failed ? <small role="alert">{t.offline}</small> : null}
      </div>
    </details>
  );
}
