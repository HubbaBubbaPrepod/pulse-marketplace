import { resolve } from 'node:path';
export interface Config {
  databaseUrl: string;
  origin: string;
  production: boolean;
  port: number;
  packageDirectory: string;
  discoveryEnabled: boolean;
  mailTokenKey?: string;
}
export const CONFIG = Symbol('CONFIG');
export function loadConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const origin = new URL(process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:3100');
  const production = process.env.NODE_ENV === 'production';
  if (
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    (production && origin.protocol !== 'https:') ||
    !['http:', 'https:'].includes(origin.protocol)
  )
    throw new Error('PUBLIC_ORIGIN must be a single origin; production requires HTTPS');
  const port = Number(process.env.API_PORT || 3101);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid API_PORT');
  return {
    databaseUrl,
    origin: origin.origin,
    production,
    port,
    packageDirectory: resolve(process.env.PACKAGE_DIRECTORY || '../../data/packages'),
    discoveryEnabled: process.env.DISCOVERY_ENABLED !== 'false',
    mailTokenKey: process.env.MAIL_TOKEN_KEY,
  };
}
