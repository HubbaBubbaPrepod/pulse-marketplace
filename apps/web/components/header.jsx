'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { Icon } from './icon';
import { copy, pathFor } from '../lib/copy.mjs';
import { applyThemeStorageEvent } from '../lib/theme-store.mjs';
import { workspaceCopy } from '../lib/workspace-copy.mjs';
import { SessionMenu } from './session-menu';
const subscribe = (fn) => {
  const onStorage = (event) => {
    if (applyThemeStorageEvent(event, document.documentElement)) fn();
  };
  window.addEventListener('pulse-market-theme', fn);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('pulse-market-theme', fn);
    window.removeEventListener('storage', onStorage);
  };
};
const snapshot = () => document.documentElement.dataset.theme || 'dark';
export function Header({ lang, preview }) {
  const t = copy[lang],
    pathname = usePathname(),
    params = useSearchParams();
  const [open, setOpen] = useState(false);
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'dark');
  const other = lang === 'ru' ? 'en' : 'ru';
  const languageHref =
    pathname.replace(/^\/(ru|en)(?=\/|$)/, `/${other}`) + (params.size ? `?${params}` : '');
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('pulse-market.theme.v1', next);
    } catch {}
    window.dispatchEvent(new Event('pulse-market-theme'));
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href={pathFor(lang)} aria-label="Pulse Marketplace">
          <Image src="/assets/pulse-mark.svg" width={35} height={35} alt="" />
          <strong>PULSE</strong>
          <span className="brand-divider">/</span>
          <span className="brand-label">MARKETPLACE</span>
        </Link>
        <nav
          className={`main-nav ${open ? 'is-open' : ''}`}
          aria-label={lang === 'ru' ? 'Основная навигация' : 'Main navigation'}
        >
          <Link
            href={pathFor(lang)}
            aria-current={pathname === pathFor(lang) ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {t.catalog}
          </Link>
          <Link
            href={pathFor(lang, 'developers')}
            aria-current={pathname.includes('/developers') ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {t.developers}
          </Link>
          {preview ? (
            <Link
              href={pathFor(lang, 'author')}
              aria-current={/\/(author|moderation)\//.test(pathname) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {workspaceCopy[lang].workspace}
            </Link>
          ) : null}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            aria-label={t.theme}
            title={t.theme}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <a
            className="language-switch"
            href={languageHref}
            hrefLang={other}
            aria-label={`${t.language}: ${other.toUpperCase()}`}
          >
            {lang.toUpperCase()}
            <Icon name="chevron" size={13} />
          </a>
          <SessionMenu lang={lang} />
          <button
            className="icon-button mobile-menu"
            aria-expanded={open}
            aria-label={lang === 'ru' ? 'Меню' : 'Menu'}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      {preview ? (
        <div className="preview-ribbon">
          <span />
          {t.preview}
          <span className="preview-note">
            {lang === 'ru'
              ? 'Модули показаны для проверки интерфейса'
              : 'Modules shown for interface review'}
          </span>
        </div>
      ) : null}
    </header>
  );
}
