'use client';
import Link from 'next/link';
import { useRef, useState, startTransition, ViewTransition } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Icon } from './icon';
import { ModuleArt } from './module-art';
import { copy, pathFor } from '../lib/copy.mjs';
gsap.registerPlugin(useGSAP);
export function Detail({ lang, module }) {
  const t = copy[lang],
    scope = useRef(null),
    [tab, setTab] = useState(0),
    [instructions, setInstructions] = useState(false);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          gsap.from('.detail-panel-content', {
            opacity: 0,
            y: 12,
            duration: 0.45,
            ease: 'power2.out',
            clearProps: 'all',
          });
        },
        scope,
      );
      return () => mm.revert();
    },
    { scope, dependencies: [tab], revertOnUpdate: true },
  );
  function tabKey(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? 2
          : (tab + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    startTransition(() => setTab(next));
    scope.current.querySelector(`#tab-${next}`)?.focus();
  }
  return (
    <div className="detail-page" ref={scope}>
      <nav className="breadcrumb" aria-label={lang === 'ru' ? 'Путь' : 'Breadcrumb'}>
        <Link href={pathFor(lang)} transitionTypes={['nav-back']}>
          {t.catalog}
        </Link>
        <span>/</span>
        <Link href={`${pathFor(lang)}?category=${module.category}`} transitionTypes={['nav-back']}>
          {t.categories[module.category]}
        </Link>
        <span>/</span>
        <span aria-current="page">{module.name}</span>
      </nav>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="module-heading">
            <ViewTransition name={`module-${module.id}`} share="morph" default="none">
              <ModuleArt id={module.id} large priority />
            </ViewTransition>
            <div>
              <span className="eyebrow">PULSE / {t.categories[module.category].toUpperCase()}</span>
              <h1>{module.name}</h1>
              <p>{module.description[lang]}</p>
              <div className="module-meta">
                {module.author ? (
                  <span>
                    <Icon name="github" size={14} />
                    {module.author}
                  </span>
                ) : null}
                <span className="tag">
                  <Icon name="clock" size={13} />
                  {t.example}
                </span>
                {module.repository ? <span>MIT</span> : null}
              </div>
            </div>
          </div>
          <div role="tablist" aria-label={module.name} className="detail-tabs" onKeyDown={tabKey}>
            {t.tabs.map((label, i) => (
              <button
                key={label}
                id={`tab-${i}`}
                role="tab"
                aria-selected={tab === i}
                aria-controls={`panel-${i}`}
                tabIndex={tab === i ? 0 : -1}
                onClick={() => startTransition(() => setTab(i))}
              >
                {label}
                {tab === i ? (
                  <ViewTransition name="detail-tab-indicator" share="tab-underline" default="none">
                    <span className="tab-indicator" />
                  </ViewTransition>
                ) : null}
              </button>
            ))}
          </div>
          <ViewTransition key={tab} enter="fade-in" exit="fade-out" default="none">
            <div
              className="detail-panel-content"
              role="tabpanel"
              tabIndex={0}
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
            >
              {tab === 0 ? (
                <>
                  <section className="surface detail-section">
                    <h2>{t.adds}</h2>
                    <p>
                      {module.id === 'docker'
                        ? lang === 'ru'
                          ? 'Контейнеры, их состояние и использование ресурсов — в привычном интерфейсе Pulse.'
                          : 'Containers, their state and resource usage — inside your familiar Pulse interface.'
                        : module.description[lang]}
                    </p>
                    {module.id === 'docker' ? (
                      <div className="container-preview">
                        <div className="example-caption">
                          <Icon name="monitor" size={14} />
                          {t.sampleData}
                        </div>
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>{t.containers}</th>
                                <th>{t.status}</th>
                                <th>CPU</th>
                                <th>{t.memory}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                ['nginx', 'a1b2c3d4', '12%', '256 MB', 12],
                                ['postgres', 'e5f6g7h8', '4%', '1.2 GB', 4],
                              ].map(([name, id, cpu, memory, load]) => (
                                <tr key={id}>
                                  <td>
                                    <span className="container-name">
                                      <Icon
                                        name={name === 'nginx' ? 'web' : 'databases'}
                                        size={25}
                                      />
                                      <span>
                                        <strong>{name}</strong>
                                        <small>{id}</small>
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span className="status-dot" />
                                    {t.running}
                                  </td>
                                  <td>
                                    <span>{cpu}</span>
                                    <span className="resource-bar">
                                      <i style={{ width: `${load}%` }} />
                                    </span>
                                  </td>
                                  <td>
                                    <span>{memory}</span>
                                    <span className="resource-bar">
                                      <i style={{ width: name === 'nginx' ? '30%' : '68%' }} />
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="concept-note">
                        <Icon name="info" />
                        {t.example} · {t.noVersion}
                      </div>
                    )}
                  </section>
                  <section className="surface detail-section permission-section">
                    <h2>{t.access}</h2>
                    <div className="permission-row">
                      <span className="permission-icon">
                        <Icon name="terminal" size={22} />
                      </span>
                      <div>
                        <strong>{module.id === 'docker' ? t.permission : t.reviewPending}</strong>
                        <p>{module.id === 'docker' ? t.permissionWarning : t.reviewExplain}</p>
                      </div>
                      <Icon name="shield" size={23} />
                    </div>
                  </section>
                  {module.repository ? (
                    <a
                      className="source-link"
                      href={module.repository}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="github" />
                      {t.moduleSource}
                      <Icon name="external" size={15} />
                    </a>
                  ) : null}
                </>
              ) : tab === 1 ? (
                <section className="surface detail-section">
                  <h2>{t.tabs[1]}</h2>
                  {module.version ? (
                    <>
                      <div className="version-row">
                        <strong>v{module.version}</strong>
                        <span className="tag">{t.example}</span>
                      </div>
                      <p>{t.versionNote}</p>
                    </>
                  ) : (
                    <p>{t.noVersion}</p>
                  )}
                </section>
              ) : (
                <section className="surface detail-section review-panel">
                  <span className="review-icon">
                    <Icon name="shield" size={34} />
                  </span>
                  <h2>{t.reviewPending}</h2>
                  <p>{t.reviewExplain}</p>
                  <ul className="review-list">
                    {t.reviewItems.map((label) => (
                      <li key={label}>
                        <Icon name="clock" size={17} />
                        <span>{label}</span>
                        <small>{t.reviewPending}</small>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </ViewTransition>
          {instructions ? (
            <section
              className="surface detail-section install-instructions"
              id="install-instructions"
            >
              <h2>{t.howInstall}</h2>
              <ol>
                {t.installSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link
                href={`https://pulse.hubba-cloud.ru/${lang === 'en' ? 'en/' : ''}install/`}
                target="_blank"
                rel="noreferrer"
              >
                {t.docs}
                <Icon name="external" size={15} />
              </Link>
            </section>
          ) : null}
        </div>
        <aside className="install-sidebar">
          <section className="surface install-card">
            <div className="section-title">
              <h2>{t.installation}</h2>
              <Icon name="download" size={19} />
            </div>
            <label className="version-selector">
              {t.version}
              <select aria-label={t.version} disabled>
                <option>{module.version || '—'}</option>
              </select>
            </label>
            <span className="field-label">{t.compatible}</span>
            <div className="compatibility-tags">
              {module.platforms.map((platform) => (
                <span key={platform}>
                  {platform.replace('linux-', 'Linux ').replace('windows-', 'Windows ')}
                </span>
              ))}
            </div>
            <button className="button download-button" disabled aria-describedby="download-reason">
              {t.download}
              <Icon name="download" size={18} />
            </button>
            <p className="download-reason" id="download-reason">
              {t.noDownload}
            </p>
            <button
              className="button button-outline how-install"
              aria-expanded={instructions}
              aria-controls="install-instructions"
              onClick={() => setInstructions(!instructions)}
            >
              {t.howInstall}
              <Icon name="arrow" size={17} />
            </button>
            <div className="digest">
              <span>{t.digest}</span>
              <div>
                <Icon name="lock" size={15} />
                <span>{t.digestPending}</span>
              </div>
              <small>{t.noRegistration}</small>
            </div>
          </section>
          <section className="surface review-card">
            <h2>{t.review}</h2>
            <p className="review-status">
              <Icon name="clock" size={15} />
              {t.reviewPending}
            </p>
            <ul>
              {t.reviewItems.map((label) => (
                <li key={label}>
                  <span className="pending-check" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
