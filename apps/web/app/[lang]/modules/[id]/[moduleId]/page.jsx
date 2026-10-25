import Link from 'next/link';
import { cache } from 'react';
import { publicMetadata, modulePath, moduleSchema, pageSchema } from '../../../../../lib/seo.mjs';
import { StructuredData } from '../../../../../components/structured-data';
import { notFound } from 'next/navigation';
import { api, ApiError } from '../../../../../lib/server-api';
import { accountCopy } from '../../../../../lib/account-copy.mjs';
import { ModuleArt } from '../../../../../components/module-art';
const load = cache(async (owner, id) => {
  try {
    return await api(`/modules/${encodeURIComponent(owner)}/${encodeURIComponent(id)}?runtime=all`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});
export async function generateMetadata({ params }) {
  const { lang, id, moduleId } = await params;
  const value = await load(id, moduleId);
  return publicMetadata(
    lang,
    modulePath(value.module.owner, value.module.id),
    value.module.name,
    value.module.description,
  );
}
export default async function Page({ params }) {
  const { lang, id, moduleId } = await params,
    t = accountCopy[lang];
  if (!t) notFound();
  const value = await load(id, moduleId),
    selectedModule = value.module;
  return (
    <div className="page-container">
      <article className="package-detail">
        <StructuredData
          data={pageSchema(
            lang,
            modulePath(selectedModule.owner, selectedModule.id),
            selectedModule.name,
            selectedModule.description,
          )}
        />
        <StructuredData data={moduleSchema(lang, selectedModule)} />
        <Link className="back-link" href={`/${lang}/`}>
          ← {lang === 'ru' ? 'Каталог' : 'Catalog'}
        </Link>
        <ModuleArt id={selectedModule.id} large priority />
        <span className="eyebrow">
          {selectedModule.owner} / {selectedModule.id}
        </span>
        <h1>{selectedModule.name}</h1>
        <p className="detail-description">{selectedModule.description}</p>
        <section className="surface">
          <h2>{t.approved}</h2>
          <p>{t.reviewNote}</p>
          <a href={selectedModule.sourceUrl} target="_blank" rel="noreferrer">
            {t.source} ↗
          </a>
          <h3>{t.executionRuntime}</h3>
          <p>
            {(selectedModule.executionRuntimes ?? ['native'])
              .map((runtime) => (runtime === 'wasip1' ? t.wasiRuntime : t.nativeRuntime))
              .join(' · ')}
          </p>
          {(selectedModule.executionRuntimes ?? ['native']).includes('native') ? (
            <p>{t.nativeWarning}</p>
          ) : null}
          {selectedModule.executionRuntimes?.includes('wasip1') ? <p>{t.wasiWarning}</p> : null}
          {selectedModule.capabilities?.length ? (
            <>
              <h3>{t.brokerCapabilities}</h3>
              <ul>
                {selectedModule.capabilities.map((cap) => (
                  <li key={cap}>
                    <code>{cap}</code>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <h3>{t.permissions}</h3>
          {selectedModule.permissions.length ? (
            <ul>
              {selectedModule.permissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          ) : (
            <p>{t.noPermissions}</p>
          )}
        </section>
        <section className="surface package-versions">
          <h2>{t.versions}</h2>
          {value.versions.map((version) => (
            <div className="package-version" key={version.sha256}>
              <h3>v{version.version}</h3>
              <p>
                {(version.executionRuntimes ?? ['native'])
                  .map((runtime) => (runtime === 'wasip1' ? t.wasiRuntime : t.nativeRuntime))
                  .join(' · ')}
              </p>
              <p>
                {version.platforms.join(' · ')} / {(version.size / 1024 / 1024).toFixed(2)} MiB
              </p>
              <p>
                {t.reviewed}:{' '}
                {new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(
                  new Date(version.reviewedAt),
                )}{' '}
                UTC
              </p>
              <p>
                {t.digest}
                <br />
                <code>{version.sha256}</code>
              </p>
              <a className="button" href={`/api/v1/packages/${version.sha256}`} download>
                {t.download} ↓
              </a>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
