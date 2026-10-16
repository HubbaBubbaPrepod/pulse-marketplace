import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../apps/web/.next/server/app/', import.meta.url));
for (const lang of ['ru', 'en']) {
  const html = await readFile(resolve(root, lang, 'privacy.html'), 'utf8');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(
    main?.includes('<article class="legal-page">'),
    `${lang}: privacy must be inside the initial main content, not a detached streaming container`,
  );
  const beforeArticle = main
    .slice(0, main.indexOf('<article class="legal-page">'))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  assert.ok(
    !/<[^>]+\bhidden(?:\s|=|>)/.test(beforeArticle),
    `${lang}: privacy must be visible without JavaScript`,
  );
  console.log(`${lang}: privacy is visible in initial HTML`);
}
