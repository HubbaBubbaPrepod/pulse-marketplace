import { BlockList, isIP } from 'node:net';

// https://www.cloudflare.com/ips-v4 and /ips-v6, verified 2026-10-23.
const cloudflare = new BlockList();
for (const prefix of [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
]) {
  const [address, bits] = prefix.split('/');
  cloudflare.addSubnet(address, Number(bits), isIP(address) === 6 ? 'ipv6' : 'ipv4');
}
const normalize = (value) =>
  typeof value === 'string' && isIP(value)
    ? value.startsWith('::ffff:') && isIP(value.slice(7)) === 4
      ? value.slice(7)
      : value
    : null;
export function clientAddress(request, production = false) {
  let peer = normalize(request.socket?.remoteAddress) || 'unknown';
  // The production API is loopback-only. Nginx MUST overwrite X-Real-IP
  // before forwarding to Next; arbitrary X-Forwarded-For is never trusted.
  if (production && (peer === '127.0.0.1' || peer === '::1'))
    peer = normalize(request.headers['x-real-ip']) || peer;
  if (isIP(peer) && cloudflare.check(peer, isIP(peer) === 6 ? 'ipv6' : 'ipv4'))
    return normalize(request.headers['cf-connecting-ip']) || peer;
  return peer;
}
