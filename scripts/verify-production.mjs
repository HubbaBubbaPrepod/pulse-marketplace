import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url),
  reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((resolve, reject) =>
  reservation.close((error) => (error ? reject(error) : resolve())),
);
const api = process.env.API_ORIGIN || 'http://127.0.0.1:3101';
const ready = await fetch(`${api}/api/v1/health`);
assert.equal(ready.status, 200, 'Start the API before production verification');
const catalog = await (await fetch(`${api}/api/v1/catalog`)).json();
const server = spawn(
  process.execPath,
  [
    require.resolve('next/dist/bin/next'),
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  {
    cwd: fileURLToPath(new URL('../apps/web/', import.meta.url)),
    env: { ...process.env, NODE_ENV: 'production', API_ORIGIN: api },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let output = '',
  launchError;
server.stdout.on('data', (chunk) => {
  output = (output + chunk).slice(-10000);
});
server.stderr.on('data', (chunk) => {
  output = (output + chunk).slice(-10000);
});
server.on('error', (error) => {
  launchError = error;
});
const base = `http://127.0.0.1:${port}`;
try {
  let started = false;
  for (let i = 0; i < 40; i++) {
    if (launchError) throw launchError;
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try {
      started = (await fetch(`${base}/ru/`, { signal: AbortSignal.timeout(1500) })).status === 200;
    } catch {}
    if (started) break;
    await delay(250);
  }
  assert.ok(started, `Production server unavailable: ${output}`);
  for (const lang of ['ru', 'en']) {
    const response = await fetch(`${base}/${lang}/`),
      html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(
      !html.includes('Локальный макет') && !html.includes('docker:example-1'),
      'Preview data leaked',
    );
    if (!catalog.items.length)
      assert.ok(
        html.includes(lang === 'ru' ? 'Каталог пока пуст' : 'The catalog is empty'),
        'Expected real empty catalog',
      );
    const login = await fetch(`${base}/${lang}/login/`),
      loginHtml = await login.text();
    assert.equal(login.status, 200);
    assert.match(loginHtml, /<input[^>]*name="email"/);
    assert.match(loginHtml, /<input[^>]*name="password"/);
    assert.equal(login.headers.get('referrer-policy'), 'no-referrer');
    for (const route of ['author', 'moderation']) {
      const result = await fetch(`${base}/${lang}/${route}/`, { redirect: 'manual' }),
        body = await result.text();
      assert.ok(
        (result.status === 307 && result.headers.get('location')?.includes(`/${lang}/login/`)) ||
          (result.status === 200 &&
            body.includes('NEXT_REDIRECT') &&
            body.includes(`/${lang}/login/`)),
        `${lang}/${route}: anonymous access did not redirect to login`,
      );
      assert.ok(!body.includes('docker:example-1'), 'Private preview leaked');
    }
    console.log(`PASS ${lang}: real catalog, login form and anonymous workspace protection`);
  }
  const session = await fetch(`${base}/api/v1/auth/session/`);
  assert.equal(session.status, 200);
  assert.deepEqual(await session.json(), { user: null, csrfToken: null });
  console.log('PASS same-origin API proxy and anonymous session');
  const missing = await fetch(`${base}/ru/modules/not-a-published-owner/missing-module/`),
    missingHtml = await missing.text();
  assert.ok(missing.status === 404 || missingHtml.includes('NEXT_HTTP_ERROR_FALLBACK;404'));
  assert.ok(!missingHtml.includes('Скачать JSON'));
  console.log('PASS unpublished module has no download');
  const unsupported = await fetch(`${base}/zz/login/`);
  assert.equal(unsupported.status, 404);
  console.log('PASS unsupported locale');
} finally {
  if (server.pid && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await Promise.race([
      exited,
      delay(5000).then(() => {
        if (server.exitCode === null) throw new Error(`Test process did not stop: ${server.pid}`);
      }),
    ]);
  }
}
