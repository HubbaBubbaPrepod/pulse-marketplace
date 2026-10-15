import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
const hosts = new Set([
  'api.github.com',
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
]);
export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && [0, 2].includes(c)))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  return (
    isIP(address) === 6 && /^[23]/i.test(address) && !/^(2001:db8:|2001:0:|2002:)/i.test(address)
  );
}
export function validateGitHubUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    !hosts.has(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new Error('Disallowed GitHub URL');
  return url;
}
export class GitHubRateLimit extends Error {
  constructor(retryAt) {
    super('GitHub rate limit');
    this.retryAt = retryAt;
  }
}
export async function githubBytes(
  value,
  {
    token,
    limit = 1024 * 1024,
    accept = 'application/vnd.github+json',
    deadline = Date.now() + 120000,
    redirects = 0,
    signal,
  } = {},
) {
  const url = validateGitHubUrl(value);
  if (redirects > 3 || Date.now() >= deadline) throw new Error('GitHub request limit exceeded');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((item) => !isPublicAddress(item.address)))
    throw new Error('Disallowed GitHub address');
  const address = addresses[0];
  const headers = {
    'User-Agent': 'PulseMarketplace/0.1',
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (url.hostname === 'api.github.com' && token) headers.Authorization = `Bearer ${token}`;
  const response = await new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers,
        signal,
        lookup: (_hostname, options, callback) =>
          options.all ? callback(null, [address]) : callback(null, address.address, address.family),
        timeout: Math.max(1, Math.min(30000, deadline - Date.now())),
      },
      (response) => {
        const chunks = [];
        let size = 0;
        const status = response.statusCode || 500;
        if ([301, 302, 303, 307, 308].includes(status)) {
          response.resume();
          resolve({ status, headers: response.headers, body: Buffer.alloc(0) });
          return;
        }
        response.on('data', (chunk) => {
          size += chunk.length;
          if (size > limit) request.destroy(new Error('GitHub response too large'));
          else chunks.push(chunk);
        });
        response.on('end', () =>
          resolve({ status, headers: response.headers, body: Buffer.concat(chunks) }),
        );
        response.on('error', reject);
      },
    );
    request.on('timeout', () => request.destroy(new Error('GitHub request timed out')));
    request.on('error', reject);
    const timer = setTimeout(
      () => request.destroy(new Error('GitHub request deadline exceeded')),
      Math.max(1, deadline - Date.now()),
    );
    timer.unref();
    request.once('close', () => clearTimeout(timer));
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (typeof response.headers.location !== 'string') throw new Error('Invalid GitHub redirect');
    return githubBytes(new URL(response.headers.location, url).href, {
      token,
      limit,
      accept,
      deadline,
      redirects: redirects + 1,
      signal,
    });
  }
  if (
    response.status === 429 ||
    (response.status === 403 && response.headers['x-ratelimit-remaining'] === '0')
  ) {
    const reset = Number(response.headers['x-ratelimit-reset']) * 1000;
    const retry = Number(response.headers['retry-after']) * 1000 + Date.now();
    throw new GitHubRateLimit(
      Math.min(
        Date.now() + 3600000,
        Math.max(
          Date.now() + 60000,
          Number.isFinite(reset) && reset > Date.now()
            ? reset
            : Number.isFinite(retry)
              ? retry
              : Date.now() + 900000,
        ),
      ),
    );
  }
  if (response.status !== 200) {
    const error = new Error(`GitHub status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.body;
}
