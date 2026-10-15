import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
const fixture = http.createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  if (request.url === '/api/v1/auth/session') {
    response.end(
      JSON.stringify({
        user:
          request.headers.cookie === 'test-session=approved'
            ? { id: 'test-actor', displayName: 'Test', role: 'author', githubId: null }
            : null,
        csrfToken: null,
      }),
    );
    return;
  }
  if (request.url === '/api/v1/auth/capabilities') {
    response.end(
      JSON.stringify({
        github: false,
        google: false,
        email: true,
        emailRegistration: false,
        passwordReset: false,
      }),
    );
    return;
  }
  response.writeHead(404);
  response.end('{}');
});
fixture.listen(0, '127.0.0.1');
await once(fixture, 'listening');
const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const require = createRequire(import.meta.url),
  server = spawn(
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
      env: {
        ...process.env,
        NODE_ENV: 'production',
        API_ORIGIN: `http://127.0.0.1:${fixture.address().port}`,
      },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
let output = '';
server.stdout.on('data', (value) => (output += value));
server.stderr.on('data', (value) => (output += value));
try {
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      ready =
        (
          await fetch(base + '/ru/login/', {
            redirect: 'manual',
            signal: AbortSignal.timeout(1500),
          })
        ).status === 200;
    } catch {}
    if (ready) break;
    if (server.exitCode !== null) throw new Error(output);
    await delay(250);
  }
  assert.ok(ready, 'Temporary Next server did not become ready');
  for (const [path, destination] of [
    ['/ru/login/', '/ru/author/'],
    ['/en/login/?next=%2Fen%2Fmoderation%2F', '/en/moderation/'],
    ['/ru/login/?next=https%3A%2F%2Fevil.example', '/ru/author/'],
  ]) {
    const response = await fetch(base + path, {
      headers: { cookie: 'test-session=approved' },
      redirect: 'manual',
    });
    const body = await response.text();
    assert.ok(response.status === 307 || response.status === 200, 'Unexpected login response');
    if (response.status === 307) assert.equal(response.headers.get('location'), destination);
    else {
      assert.ok(
        body.includes('http-equiv="refresh"') && body.includes(`url=${destination}`),
        'Authenticated login must contain a streamed redirect',
      );
      assert.ok(
        !/<input[^>]*name="password"/.test(body),
        'Authenticated login must not render the form',
      );
    }
    console.log('PASS authenticated login redirect', destination);
  }
  const anonymous = await fetch(base + '/en/login/');
  assert.equal(anonymous.status, 200);
  const html = await anonymous.text();
  assert.match(html, /<input[^>]*name="email"/);
  console.log('PASS anonymous login remains available');
} finally {
  if (server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
  await new Promise((resolve) => fixture.close(resolve));
}
