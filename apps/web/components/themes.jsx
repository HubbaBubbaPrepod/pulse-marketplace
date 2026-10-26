'use client';
import Link from 'next/link';
import { useState, useDeferredValue } from 'react';
import { useSearchParams } from 'next/navigation';
import { themeCopy, filterThemes } from '../lib/theme-catalog.mjs';
import presets from '../lib/theme-presets.json';
import { ThemePreview } from './theme-preview';
import { CatalogNavigation } from './catalog-navigation';
export function ThemePlayground({ lang }) {
  const t = themeCopy[lang],
    [selected, setSelected] = useState(presets[0]);
  return (
    <section className="theme-playground" aria-labelledby="theme-playground-title">
      <div className="theme-section-head">
        <div>
          <h2 id="theme-playground-title">{t.builtin}</h2>
          <p>{t.builtinText}</p>
        </div>
        <div className="theme-preset-buttons" role="group" aria-label={t.builtin}>
          {presets.map((theme, i) => (
            <button
              key={theme.id}
              aria-pressed={selected.id === theme.id}
              onClick={() => setSelected(theme)}
            >
              {i === 0 ? t.darkOne : i === 1 ? t.lightOne : theme.name}
            </button>
          ))}
        </div>
      </div>
      <ThemePreview theme={selected} lang={lang} />
      <p className="theme-preview-note">{t.previewOnly}</p>
    </section>
  );
}
export function Themes({ lang, rows, unavailable = false }) {
  const t = themeCopy[lang],
    params = useSearchParams();
  const [state, setState] = useState(() => ({
    url: params.toString(),
    query: params.get('q') || '',
    mode: ['dark', 'light'].includes(params.get('mode')) ? params.get('mode') : 'all',
  }));
  if (state.url !== params.toString())
    setState({
      url: params.toString(),
      query: params.get('q') || '',
      mode: ['dark', 'light'].includes(params.get('mode')) ? params.get('mode') : 'all',
    });
  const visible = filterThemes(rows, useDeferredValue(state));
  function update(patch) {
    const next = { ...state, ...patch },
      query = new URLSearchParams();
    if (next.query) query.set('q', next.query);
    if (next.mode !== 'all') query.set('mode', next.mode);
    setState({ ...next, url: query.toString() });
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (query.size ? '?' + query : ''),
    );
  }
  return (
    <div className="themes-page">
      <CatalogNavigation lang={lang} active="themes" />
      <header className="themes-hero">
        <span className="eyebrow">PULSE / THEMES</span>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        <span className="theme-safety">{t.safe}</span>
      </header>
      <ThemePlayground lang={lang} />
      <section className="community-themes" aria-labelledby="community-themes-title">
        <div className="theme-section-head">
          <h2 id="community-themes-title">{t.themes}</h2>
          <span className="theme-result-count" role="status">
            {t.results}: {visible.length}
          </span>
        </div>
        <div className="theme-toolbar">
          <label>
            <span>{t.search}</span>
            <input
              type="search"
              value={state.query}
              placeholder={t.searchHint}
              maxLength={128}
              onChange={(e) => update({ query: e.target.value })}
            />
          </label>
          <div role="group" aria-label={t.mode}>
            {[
              ['all', t.all],
              ['dark', t.dark],
              ['light', t.light],
            ].map(([mode, label]) => (
              <button
                key={mode}
                aria-pressed={state.mode === mode}
                onClick={() => update({ mode })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {unavailable ? (
          <div className="empty-state" role="alert">
            <p>{t.unavailable}</p>
          </div>
        ) : visible.length ? (
          <div className="theme-grid">
            {visible.map((row) => (
              <article className="theme-card" key={`${row.owner}/${row.id}`}>
                <Link
                  className="theme-card-link"
                  href={`/${lang}/themes/${encodeURIComponent(row.owner)}/${encodeURIComponent(row.id)}/`}
                >
                  <ThemePreview theme={row.theme} lang={lang} compact />
                  <div className="theme-card-meta">
                    <div>
                      <h3>{row.name}</h3>
                      <p>
                        {row.owner} · {row.version}
                      </p>
                    </div>
                    <span>{row.mode === 'dark' ? t.darkOne : t.lightOne}</span>
                  </div>
                  <p>{row.description}</p>
                  <span className="text-link">{t.preview} →</span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="theme-empty">
            <span className="theme-empty-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <h3>{rows.length ? t.noResults : t.empty}</h3>
            <p>{rows.length ? '' : t.emptyText}</p>
            {rows.length ? (
              <button
                className="button button-outline"
                onClick={() => update({ query: '', mode: 'all' })}
              >
                {t.reset}
              </button>
            ) : (
              <Link className="button button-outline" href={`/${lang}/developers/#themes`}>
                {t.publish} →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
export function ThemeDetail({ lang, row, versions }) {
  const t = themeCopy[lang],
    [selected, setSelected] = useState(row);
  return (
    <div className="theme-detail">
      <Link href={`/${lang}/themes/`} className="text-link">
        ← {t.back}
      </Link>
      <header className="theme-section-head">
        <div>
          <span className="eyebrow">PULSE / THEME</span>
          <h1>{row.name}</h1>
          <p>{row.description}</p>
        </div>
        <span>{row.owner}</span>
      </header>
      <div className="theme-detail-grid">
        <div>
          <ThemePreview theme={selected.theme} lang={lang} />
          <section className="theme-palette">
            <h2>{t.palette}</h2>
            <div>
              {Object.entries(selected.theme.colors).map(([key, value]) => (
                <span key={key}>
                  <i style={{ backgroundColor: value }} />
                  <code>{value}</code>
                  <small>{key}</small>
                </span>
              ))}
            </div>
          </section>
        </div>
        <aside className="theme-install surface">
          <label htmlFor="theme-version">{t.version}</label>
          <select
            id="theme-version"
            value={selected.version}
            onChange={(e) => setSelected(versions.find((v) => v.version === e.target.value))}
          >
            {versions.map((v) => (
              <option key={v.version}>{v.version}</option>
            ))}
          </select>
          <p>
            {selected.mode === 'dark' ? t.darkOne : t.lightOne} · {selected.owner}
          </p>
          <a className="button" href={selected.downloadUrl} download>
            {t.download} ↓
          </a>
          <a className="text-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">
            {t.source} ↗
          </a>
          <h2>{t.install}</h2>
          <ol>
            <li>{t.step1}</li>
            <li>{t.step2}</li>
            <li>{t.step3}</li>
          </ol>
          <p>{t.safe}</p>
          <small>{t.packageHash}</small>
          <code className="theme-hash">{selected.sha256}</code>
        </aside>
      </div>
    </div>
  );
}
