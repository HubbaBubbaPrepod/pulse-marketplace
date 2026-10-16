import test from 'node:test';
import assert from 'node:assert/strict';

import * as seo from '../apps/web/lib/seo.mjs';
const row = {
  owner: 'alice',
  id: 'docker',
  name: 'Docker',
  description: 'Monitor Docker containers',
  version: '1.0.3',
  platforms: ['linux-amd64'],
  sourceUrl: 'https://github.com/alice/docker',
  reviewedAt: '2026-10-15T12:00:00.000Z',
};

test('public pages provide canonical language alternatives and social metadata', () => {
  const result = seo.publicMetadata?.(
    'en',
    'developers',
    'Build modules',
    'Publish open-source Pulse modules.',
  );
  assert.equal(result?.robots.index, true);
  assert.equal(result?.alternates.canonical, 'https://marketplace.hubba-cloud.ru/en/developers/');
  assert.equal(
    result?.alternates.languages.ru,
    'https://marketplace.hubba-cloud.ru/ru/developers/',
  );
  assert.equal(result?.openGraph.locale, 'en_US');
  assert.equal(result?.twitter.card, 'summary_large_image');
  assert.equal(result?.title.absolute, 'Build modules · Pulse Marketplace');
});

test('search and filter variants do not compete with the canonical catalog', () => {
  const result = seo.catalogMetadata?.('ru', { q: 'docker' });
  assert.equal(result?.robots.index, false);
  assert.equal(result?.robots.follow, true);
  assert.equal(result?.alternates.canonical, 'https://marketplace.hubba-cloud.ru/ru/');
  assert.equal(seo.catalogMetadata?.('en', {})?.robots.index, true);
});

test('sitemap includes namespaced published modules once and omits private routes', () => {
  const entries = seo.sitemapEntries?.([row, row], ['privacy', 'terms'], '2026-10-16') || [];
  const urls = entries.map((entry) => entry.url);
  assert.equal(
    urls.filter((url) => url === 'https://marketplace.hubba-cloud.ru/en/modules/alice/docker/')
      .length,
    1,
  );
  assert.ok(urls.includes('https://marketplace.hubba-cloud.ru/ru/privacy/'));
  assert.ok(!urls.some((url) => /login|author|moderation|api\//.test(url)));
  assert.equal(
    entries.find((entry) => entry.url.endsWith('/en/modules/alice/docker/'))?.lastModified,
    row.reviewedAt,
  );
  assert.equal(entries.find((entry) => entry.url.endsWith('/en/'))?.lastModified, undefined);
});

test('module structured data describes real software without invented ratings or offers', () => {
  const data = seo.moduleSchema?.('en', row);
  assert.equal(data?.['@type'], 'SoftwareApplication');
  assert.equal(data?.softwareVersion, '1.0.3');
  assert.equal(data?.author.name, 'alice');
  assert.equal(data?.url, 'https://marketplace.hubba-cloud.ru/en/modules/alice/docker/');
  assert.equal(data?.aggregateRating, undefined);
  assert.equal(data?.offers, undefined);
});

test('JSON-LD cannot terminate its enclosing script through a module description', () => {
  const text = seo.serializeSchema?.({ description: '</script><script>alert(1)</script>' });
  assert.ok(text && !text.includes('<'));
  assert.equal(JSON.parse(text).description, '</script><script>alert(1)</script>');
});

test('catalog schema links real modules without a one-item breadcrumb trail', () => {
  const graph = seo.pageSchema('en', '', 'Catalog', 'Pulse modules', [row])['@graph'];
  assert.ok(!graph.some((item) => item['@type'] === 'BreadcrumbList'));
  const list = graph.find((item) => item['@type'] === 'CollectionPage').mainEntity;
  assert.equal(
    list.itemListElement[0].url,
    'https://marketplace.hubba-cloud.ru/en/modules/alice/docker/',
  );
});
