import { origin } from '../lib/seo.mjs';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
