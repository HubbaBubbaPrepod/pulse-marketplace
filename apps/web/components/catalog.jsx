'use client';
import Link from 'next/link';
import {
  useRef,
  useState,
  useEffect,
  useDeferredValue,
  useTransition,
  ViewTransition,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Icon } from './icon';
import { ModuleArt } from './module-art';
import { AuthorCallout } from './footer';
import { categories, filterModules, filterQuery, syncFilterState } from '../lib/catalog.mjs';
import { copy, pathFor, moduleCount } from '../lib/copy.mjs';
import { accountCopy } from '../lib/account-copy.mjs';
import { transitionName } from '../lib/api-catalog.mjs';
gsap.registerPlugin(useGSAP);
export function Catalog({
  lang,
  modules,
  initialFilters,
  pageMode = false,
  total = modules.length,
  page = 0,
  nextPage = null,
  categoryCounts = {},
}) {
  const t = copy[lang],
    scope = useRef(null),
    search = useRef(null);
  const params = useSearchParams();
  const router = useRouter(),
    [pending, startTransition] = useTransition();
  const [state, setState] = useState(() => ({ url: params.toString(), filters: initialFilters }));
  const reconciled = syncFilterState(state, params.toString());
  if (reconciled !== state) setState(reconciled);
  const filters = reconciled.filters;
  const deferredFilters = useDeferredValue(filters);
  const visible = pageMode ? modules : filterModules(modules, deferredFilters),
    identity = visible.map((m) => m.id).join(',');
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          if (!scope.current.querySelector('.module-card')) return;
          gsap.from('.module-card', {
            y: 22,
            opacity: 0,
            duration: 0.65,
            stagger: 0.065,
            ease: 'power3.out',
            clearProps: 'all',
          });
        },
        scope,
      );
      return () => mm.revert();
    },
    { scope, dependencies: [identity], revertOnUpdate: true },
  );
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => {
      window.removeEventListener('keydown', shortcut);
    };
  }, []);
  function update(patch) {
    const next = { ...filters, ...patch };
    setState({ ...reconciled, filters: next });
    const query = filterQuery(next);
    if (!pageMode)
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`,
      );
  }
  const nextQuery = filterQuery(filters),
    initialQuery = filterQuery(initialFilters);
  useEffect(() => {
    if (!pageMode || nextQuery === initialQuery) return;
    const timer = setTimeout(
      () =>
        startTransition(() =>
          router.replace(`/${lang}/${nextQuery ? '?' + nextQuery : ''}`, { scroll: false }),
        ),
      250,
    );
    return () => clearTimeout(timer);
  }, [pageMode, nextQuery, initialQuery, lang, router]);
  function reset() {
    update({ query: '', platform: 'all', category: 'all', sort: 'name' });
  }
  return (
    <section className="catalog-section" ref={scope} aria-label={t.catalog}>
      <div className="catalog-toolbar">
        <div className="search-field">
          <Icon name="search" />
          <input
            type="search"
            ref={search}
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder={t.search}
            aria-label={t.search}
            autoComplete="off"
            maxLength={200}
          />
          {filters.query ? (
            <button
              className="icon-button"
              aria-label={lang === 'ru' ? 'Очистить поиск' : 'Clear search'}
              onClick={() => update({ query: '' })}
            >
              <Icon name="close" size={16} />
            </button>
          ) : (
            <kbd>Ctrl K</kbd>
          )}
        </div>
        <div className="platform-segment" aria-label={t.platforms}>
          {['all', 'linux', 'windows'].map((platform) => (
            <button
              key={platform}
              aria-pressed={filters.platform === platform}
              onClick={() => update({ platform })}
            >
              {platform === 'all' ? t.all : platform === 'linux' ? 'Linux' : 'Windows'}
            </button>
          ))}
        </div>
        <label className="sort-field">
          <span className="sr-only">{t.sort}</span>
          <select value={filters.sort} onChange={(event) => update({ sort: event.target.value })}>
            <option value="name">{t.sortAsc}</option>
            <option value="name-desc">{t.sortDesc}</option>
          </select>
          <Icon name="chevron" size={14} />
        </label>
      </div>
      <div className="catalog-layout">
        <aside className="category-rail" aria-label={lang === 'ru' ? 'Категории' : 'Categories'}>
          {categories.map((category) => (
            <button
              key={category}
              className="category-button"
              aria-pressed={filters.category === category}
              onClick={() => update({ category })}
            >
              <Icon name={category} />
              <span>{t.categories[category]}</span>
              <small>
                {pageMode
                  ? (categoryCounts[category] ?? 0)
                  : category === 'all'
                    ? modules.length
                    : modules.filter((m) => m.category === category).length}
              </small>
            </button>
          ))}
          <div className="rail-note">
            <Icon name="shield" size={24} />
            <p>
              {lang === 'ru'
                ? 'Исходники открыты. Доступ прозрачен.'
                : 'Open source. Transparent access.'}
            </p>
            <Link href={`${pathFor(lang, 'developers')}#trust`}>
              {lang === 'ru' ? 'Как это работает' : 'How it works'}
              <Icon name="external" size={12} />
            </Link>
          </div>
        </aside>
        <div
          className="catalog-results"
          aria-busy={pageMode && (pending || nextQuery !== initialQuery)}
        >
          <div className="results-heading">
            <span>{t.categories[filters.category]}</span>
            <span role="status" aria-live="polite">
              {pending
                ? accountCopy[lang].busy
                : moduleCount(pageMode ? total : visible.length, lang)}
            </span>
          </div>
          {visible.length ? (
            <div className="module-grid">
              {visible.map((module) => (
                <ViewTransition key={module.id}>
                  <Link
                    className="module-card"
                    href={pathFor(lang, `modules/${module.id}`)}
                    transitionTypes={['nav-forward']}
                  >
                    <div className="card-meta">
                      <span className="tag">
                        {module.example ? t.example : accountCopy[lang].approved}
                      </span>
                      {module.version ? <span className="version">v{module.version}</span> : null}
                    </div>
                    <ViewTransition name={transitionName(module.id)} share="morph" default="none">
                      <ModuleArt
                        id={module.moduleId || module.id}
                        priority={module.moduleId === 'docker'}
                      />
                    </ViewTransition>
                    <div className="card-copy">
                      <h2>{module.name}</h2>
                      {module.owner ? <small className="module-owner">{module.owner}</small> : null}
                      <p>{module.description[lang]}</p>
                    </div>
                    <div className="card-bottom">
                      <div className="platform-tags">
                        {['linux', 'windows']
                          .filter((os) => module.platforms.some((p) => p.startsWith(os)))
                          .map((os) => (
                            <span key={os}>{os === 'linux' ? 'Linux' : 'Windows'}</span>
                          ))}
                      </div>
                      <span className="card-arrow">
                        <Icon name="arrow" size={21} />
                      </span>
                    </div>
                  </Link>
                </ViewTransition>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name={modules.length || nextQuery || page > 0 ? 'search' : 'box'} size={40} />
              <h2>{modules.length || nextQuery || page > 0 ? t.emptyTitle : t.unpublishedTitle}</h2>
              <p>{modules.length || nextQuery || page > 0 ? t.emptyText : t.unpublishedText}</p>
              {modules.length || nextQuery || page > 0 ? (
                <button className="button button-outline" onClick={reset}>
                  {t.reset}
                  <Icon name="arrow" size={16} />
                </button>
              ) : (
                <Link href={pathFor(lang, 'developers')} className="button button-outline">
                  {t.developers}
                  <Icon name="arrow" size={16} />
                </Link>
              )}
            </div>
          )}
          {pageMode && (page > 0 || nextPage !== null) ? (
            <nav
              className="account-actions"
              aria-label={lang === 'ru' ? 'Страницы каталога' : 'Catalog pages'}
            >
              {page > 0 ? (
                <Link
                  className="button button-outline"
                  href={`/${lang}/?${initialQuery}${initialQuery ? '&' : ''}page=${page - 1}`}
                  scroll={false}
                >
                  {lang === 'ru' ? '← Назад' : '← Previous'}
                </Link>
              ) : null}
              {nextPage !== null ? (
                <Link
                  className="button button-outline"
                  href={`/${lang}/?${initialQuery}${initialQuery ? '&' : ''}page=${nextPage}`}
                  scroll={false}
                >
                  {lang === 'ru' ? 'Дальше →' : 'Next →'}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
      <AuthorCallout lang={lang} />
    </section>
  );
}
