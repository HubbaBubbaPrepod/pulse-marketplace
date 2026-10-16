export const origin = 'https://marketplace.hubba-cloud.ru';
export const languages = ['ru', 'en'];
export const seoCopy = {
  ru: {
    title: 'Модули для мониторинга серверов',
    description:
      'Бесплатный каталог модулей Pulse Monitor для Linux и Windows. Найдите расширения мониторинга, изучите исходный код и скачайте опубликованные пакеты.',
    developersTitle: 'Разработка и публикация модулей Pulse',
    developersDescription:
      'Как создать модуль Pulse Monitor, оформить GitHub-репозиторий, подготовить релиз и пройти модерацию в Pulse Marketplace.',
    catalog: 'Каталог модулей',
  },
  en: {
    title: 'Server monitoring modules',
    description:
      'Free open-source modules for Pulse Monitor on Linux and Windows. Explore monitoring extensions, inspect their source code and download published packages.',
    developersTitle: 'Build and publish Pulse modules',
    developersDescription:
      'Learn how to build a Pulse Monitor module, prepare a GitHub repository and release, and submit a package for Pulse Marketplace moderation.',
    catalog: 'Module catalog',
  },
};
export function absoluteUrl(lang, path = '') {
  return `${origin}/${lang}/${path ? `${path.replace(/^\/+|\/+$/g, '')}/` : ''}`;
}
export function modulePath(owner, id) {
  return `modules/${encodeURIComponent(owner)}/${encodeURIComponent(id)}`;
}
export function publicMetadata(lang, path, title, description, index = true) {
  const canonical = absoluteUrl(lang, path);
  const images = [
    {
      url: `${origin}/social-preview/`,
      width: 1200,
      height: 630,
      alt: 'Pulse Marketplace — open-source monitoring modules',
    },
  ];
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...languages.map((value) => [value, absoluteUrl(value, path)]),
        ['x-default', absoluteUrl('ru', path)],
      ]),
    },
    robots: {
      index,
      follow: true,
      ...(index
        ? {
            googleBot: {
              index: true,
              follow: true,
              'max-image-preview': 'large',
              'max-snippet': -1,
              'max-video-preview': -1,
            },
          }
        : {}),
    },
    openGraph: {
      type: 'website',
      siteName: 'Pulse Marketplace',
      title: `${title} · Pulse Marketplace`,
      description,
      url: canonical,
      locale: lang === 'ru' ? 'ru_RU' : 'en_US',
      alternateLocale: lang === 'ru' ? 'en_US' : 'ru_RU',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Pulse Marketplace`,
      description,
      images: [images[0].url],
    },
  };
}
export function catalogMetadata(lang, query = {}) {
  return publicMetadata(
    lang,
    '',
    seoCopy[lang].title,
    seoCopy[lang].description,
    Object.keys(query).length === 0,
  );
}
export function sitemapEntries(rows, documents, updated) {
  const entries = languages.flatMap((lang) =>
    ['', 'developers', ...documents].map((path) => ({
      url: absoluteUrl(lang, path),
      ...(documents.includes(path) ? { lastModified: updated } : {}),
    })),
  );
  const unique = new Map(rows.map((row) => [`${row.owner}/${row.id}`, row]));
  for (const row of unique.values()) {
    for (const lang of languages)
      entries.push({
        url: absoluteUrl(lang, modulePath(row.owner, row.id)),
        lastModified: row.reviewedAt,
      });
  }
  return entries;
}
export function moduleSchema(lang, row) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${absoluteUrl(lang, modulePath(row.owner, row.id))}#software`,
    name: row.name,
    description: row.description,
    url: absoluteUrl(lang, modulePath(row.owner, row.id)),
    applicationCategory: 'DeveloperApplication',
    operatingSystem: row.platforms.join(', '),
    softwareVersion: row.version,
    isAccessibleForFree: true,
    author: {
      '@type': 'Person',
      name: row.owner,
      url: `https://github.com/${encodeURIComponent(row.owner)}`,
    },
    sameAs: row.sourceUrl,
  };
}
export function pageSchema(lang, path, title, description, rows) {
  const url = absoluteUrl(lang, path);
  const page = {
    '@type': rows ? 'CollectionPage' : path === 'contacts' ? 'ContactPage' : 'WebPage',
    '@id': `${url}#page`,
    url,
    name: title,
    description,
    inLanguage: lang,
    isPartOf: { '@id': `${origin}/#website` },
  };
  if (rows)
    page.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: rows.length,
      itemListElement: rows.map((row, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: row.name,
        url: absoluteUrl(lang, modulePath(row.owner, row.id)),
      })),
    };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'Pulse Marketplace',
        url: `${origin}/`,
        inLanguage: languages,
        publisher: {
          '@type': 'Person',
          name: 'Хабибулин Даниил Олегович',
          url: absoluteUrl(lang, 'contacts'),
        },
      },
      page,
      ...(path
        ? [
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: seoCopy[lang].catalog,
                  item: absoluteUrl(lang),
                },
                { '@type': 'ListItem', position: 2, name: title, item: url },
              ],
            },
          ]
        : []),
    ],
  };
}
export function serializeSchema(data) {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
