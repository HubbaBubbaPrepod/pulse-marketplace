'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from './icon';
import { copy, pathFor } from '../lib/copy.mjs';
import { accountCopy } from '../lib/account-copy.mjs';
export function Login({ lang, capabilities = {}, mode = 'login' }) {
  const t = accountCopy[lang],
    c = copy[lang],
    params = useSearchParams();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [done, setDone] = useState(false);
  const titles = {
    login: t.login,
    register: t.register,
    'forgot-password': t.forgot,
    'verify-email': t.verify,
    'reset-password': t.reset,
  };
  const tokenMode = ['verify-email', 'reset-password'].includes(mode);
  const mailDisabled =
    mode === 'register'
      ? !capabilities.emailRegistration
      : mode === 'forgot-password'
        ? !capabilities.passwordReset
        : false;
  const next = params.get('next');
  const destination = /^\/(ru|en)\/(author|moderation)\/$/.test(next || '')
    ? next
    : pathFor(lang, 'author');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const endpoint = mode === 'forgot-password' ? 'request-reset' : mode;
    try {
      const response = await fetch(`/api/v1/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, lang, token: params.get('token') }),
      });
      if (!response.ok) {
        setMessage(
          response.status === 401
            ? t.credentials
            : response.status === 429
              ? t.slow
              : response.status >= 500
                ? t.offline
                : t.invalid,
        );
        return;
      }
      if (mode === 'login') {
        window.location.replace(destination);
      } else {
        setDone(true);
        setMessage(tokenMode ? t.done : t.sent);
      }
    } catch {
      setMessage(t.offline);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-intro">
        <span className="eyebrow">PULSE CONTRIBUTORS</span>
        <h1>{c.authTitle}</h1>
        <p>{c.authIntro}</p>
        <div className="auth-trust">
          <Icon name="shield" size={24} />
          <span>{c.trustText}</span>
        </div>
      </div>
      <section className="surface auth-card">
        <h2>{titles[mode]}</h2>
        {mode === 'login' ? (
          <>
            {['github', 'google'].map((provider) =>
              capabilities[provider] ? (
                <a
                  className="button button-outline"
                  key={provider}
                  href={`/api/v1/auth/${provider}/start?next=${encodeURIComponent(destination)}`}
                >
                  <Icon name={provider === 'github' ? 'github' : 'globe'} size={19} />
                  {provider === 'github' ? c.githubLogin : c.googleLogin}
                </a>
              ) : (
                <button
                  className="button button-outline"
                  key={provider}
                  disabled
                  title={t.providerUnavailable}
                >
                  <Icon name={provider === 'github' ? 'github' : 'globe'} size={19} />
                  {provider === 'github' ? c.githubLogin : c.googleLogin}
                </button>
              ),
            )}
            <div className="auth-divider">{c.or}</div>
          </>
        ) : null}
        {mailDisabled ? <p className="auth-notice">{t.mailUnavailable}</p> : null}
        {params.get('error') === 'oauth' ? <p role="alert">{t.oauthError}</p> : null}
        {tokenMode && !params.get('token') ? (
          <p role="alert">{t.tokenMissing}</p>
        ) : (
          <form className="auth-fields" onSubmit={submit}>
            {mode === 'register' ? (
              <label>
                {t.name}
                <input
                  name="displayName"
                  autoComplete="name"
                  placeholder={t.namePlaceholder}
                  required
                  maxLength={64}
                />
              </label>
            ) : null}
            {!tokenMode ? (
              <label>
                {t.email}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  required
                  maxLength={254}
                />
              </label>
            ) : null}
            {mode === 'login' || tokenMode ? (
              <label>
                {tokenMode ? t.newPassword : t.password}
                <input
                  name="password"
                  type="password"
                  placeholder={tokenMode ? t.newPasswordPlaceholder : t.passwordPlaceholder}
                  autoComplete={tokenMode ? 'new-password' : 'current-password'}
                  minLength={tokenMode ? 10 : 1}
                  maxLength={1024}
                  required
                />
              </label>
            ) : null}
            <button className="button" disabled={busy || mailDisabled || done}>
              {busy ? t.busy : titles[mode]}
              <Icon name="arrow" size={16} />
            </button>
          </form>
        )}
        {message ? (
          <p role={done ? 'status' : 'alert'} className="auth-notice">
            {message}
          </p>
        ) : null}
        <p className="legal-auth-note">
          {lang === 'ru'
            ? 'Перед созданием аккаунта ознакомьтесь с документами: '
            : 'Before creating an account, read: '}
          <Link href={pathFor(lang, 'terms')}>
            {lang === 'ru' ? 'Условия использования' : 'Terms of service'}
          </Link>
          {' · '}
          <Link href={pathFor(lang, 'privacy')}>
            {lang === 'ru' ? 'Политика конфиденциальности' : 'Privacy policy'}
          </Link>
        </p>
        <div className="account-links">
          {mode === 'login' ? (
            <>
              <Link href={pathFor(lang, 'forgot-password')}>{t.forgot}</Link>
              <Link href={pathFor(lang, 'register')}>{t.register}</Link>
            </>
          ) : (
            <Link href={pathFor(lang, 'login')}>{t.backLogin}</Link>
          )}
        </div>
        <Link className="back-link" href={pathFor(lang)}>
          {c.back}
          <Icon name="arrow" size={16} />
        </Link>
      </section>
    </div>
  );
}
