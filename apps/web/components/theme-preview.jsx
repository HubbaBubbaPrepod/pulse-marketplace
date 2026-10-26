'use client';
import { useState } from 'react';
import { previewTokens, themeCopy } from '../lib/theme-catalog.mjs';
export function ThemePreview({ theme, lang, compact = false }) {
  const [view, setView] = useState('overview');
  const t = themeCopy[lang];
  return (
    <div
      className={`theme-dashboard ${compact ? 'is-compact' : ''}`}
      style={previewTokens(theme)}
      role={compact ? 'img' : 'group'}
      aria-label={`${t.preview}: ${theme.name}`}
    >
      <aside className="theme-demo-sidebar">
        <strong>PULSE</strong>
        <span className={view === 'overview' ? 'selected' : ''}>{t.overview}</span>
        <span>{t.server}</span>
        <span className={view === 'processes' ? 'selected' : ''}>{t.processes}</span>
        <span>{t.network}</span>
        <span className={view === 'logs' ? 'selected' : ''}>{t.logs}</span>
        <small>{t.settings}</small>
      </aside>
      <div className="theme-demo-main">
        <header>
          <span>{t.node}</span>
          <span className="theme-demo-online">● {t.status}</span>
        </header>
        <div className="theme-demo-body">
          <div className="theme-demo-heading">
            <strong>{t[view]}</strong>
            <span>Linux / demo</span>
          </div>
          {!compact ? (
            <div className="theme-demo-tabs" role="group" aria-label={t.preview}>
              {['overview', 'processes', 'logs'].map((v) => (
                <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                  {t[v]}
                </button>
              ))}
            </div>
          ) : null}
          {view === 'overview' ? (
            <>
              <div className="theme-demo-metrics">
                {[
                  [t.cpu, '23%'],
                  [t.memory, '62%'],
                  [t.network, '125 Mb/s'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <div className="theme-demo-meter">
                      <i />
                    </div>
                  </div>
                ))}
              </div>
              <section className="theme-demo-chart">
                <span>CPU / RAM</span>
                <svg viewBox="0 0 420 110" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 25H420M0 55H420M0 85H420" className="theme-demo-grid" />
                  <path d="M0 84L20 76L40 78L65 51L90 67L115 35L140 49L165 28L190 47L215 43L240 68L265 24L290 43L315 29L340 53L365 30L390 37L420 16" />
                  <path
                    d="M0 95L30 88L60 91L90 74L120 82L150 61L180 69L210 53L240 67L270 43L300 56L330 40L360 58L390 35L420 41"
                    className="secondary"
                  />
                </svg>
              </section>
              <div className="theme-demo-bottom">
                <section>
                  <strong>{t.processes}</strong>
                  {['nginx', 'postgres', 'pulse-agent'].map((x, i) => (
                    <div key={x}>
                      <span>{x}</span>
                      <span>{[1.3, 4.8, 0.3][i]}%</span>
                    </div>
                  ))}
                </section>
                <section>
                  <strong>{t.lastLogs}</strong>
                  <p>INFO · nginx started</p>
                  <p>INFO · Agent connected</p>
                  <p>INFO · Health check passed</p>
                </section>
              </div>
            </>
          ) : view === 'processes' ? (
            <section className="theme-demo-table">
              <div>
                <strong>PID</strong>
                <strong>{t.processes}</strong>
                <strong>CPU</strong>
                <strong>RAM</strong>
              </div>
              {[
                ['2141', 'postgres', '4.8%', '512 MB'],
                ['1147', 'nginx', '1.3%', '152 MB'],
                ['2708', 'pulse-agent', '0.3%', '64 MB'],
                ['3026', 'node', '0.7%', '328 MB'],
              ].map((row) => (
                <div key={row[0]}>
                  {row.map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              ))}
            </section>
          ) : (
            <section className="theme-demo-log">
              {['nginx started', 'Agent connected', 'Health check passed', 'Database ready'].map(
                (x, i) => (
                  <p key={x}>
                    <span>12:4{i}:01</span>
                    <b>INFO</b>
                    {x}
                  </p>
                ),
              )}
            </section>
          )}
        </div>
        <footer>{t.demo}</footer>
      </div>
    </div>
  );
}
