import { catalogRows } from '../lib/server-api';
import { sitemapEntries } from '../lib/seo.mjs';
import { legal } from '../lib/legal.mjs';

export const dynamic = 'force-dynamic';
export default async function sitemap() {
  return sitemapEntries(await catalogRows(), Object.keys(legal.documents), legal.updated);
}
