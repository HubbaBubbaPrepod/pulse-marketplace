import { catalogRows, themeRows } from '../lib/server-api';
import { sitemapEntries } from '../lib/seo.mjs';
import { legal } from '../lib/legal.mjs';

export const dynamic = 'force-dynamic';
export default async function sitemap() {
  const [modules, themes] = await Promise.all([catalogRows(), themeRows()]);
  return sitemapEntries(modules, Object.keys(legal.documents), legal.updated, themes);
}
