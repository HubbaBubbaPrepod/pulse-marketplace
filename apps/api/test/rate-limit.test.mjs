import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Sessions } from '../dist/auth/session.service.js';

test('one source cannot exhaust another source login budget for the same account', async () => {
  const counts = new Map();
  const sessions = new Sessions(
    {
      pool: {
        query: async (_sql, [key]) => {
          const count = (counts.get(key) || 0) + 1;
          counts.set(key, count);
          return { rows: [{ count }] };
        },
      },
    },
    { production: true },
  );
  const source = (ip) => ({
    socket: { remoteAddress: ip },
    headers: { 'x-forwarded-for': '192.0.2.99', 'x-real-ip': '192.0.2.99' },
  });
  for (let i = 0; i < 30; i++)
    await sessions.rateLimit(source('192.0.2.1'), 'login', 30, 'owner@example.test');
  await assert.rejects(
    () => sessions.rateLimit(source('192.0.2.1'), 'login', 30, 'owner@example.test'),
    (e) => e.status === 429,
  );
  await assert.doesNotReject(() =>
    sessions.rateLimit(source('192.0.2.2'), 'login', 30, 'owner@example.test'),
  );
  await assert.rejects(
    () => sessions.rateLimit(source('192.0.2.1'), 'login', 30, 'other@example.test'),
    (e) => e.status === 429,
  );
});

test('already blocked sources do not consume the shared login budget', async () => {
  const counts = new Map();
  const sessions = new Sessions(
    {
      pool: {
        query: async (_sql, [key]) => {
          const count = (counts.get(key) || 0) + 1;
          counts.set(key, count);
          return { rows: [{ count }] };
        },
      },
    },
    { production: true },
  );
  const source = (ip) => ({ socket: { remoteAddress: ip }, headers: {} });
  for (let i = 0; i < 30; i++)
    await sessions.rateLimit(source('192.0.2.1'), 'login', 30, 'owner@example.test');
  for (let i = 0; i < 3100; i++)
    await assert.rejects(
      () => sessions.rateLimit(source('192.0.2.1'), 'login', 30, 'owner@example.test'),
      (e) => e.status === 429,
    );
  await assert.doesNotReject(() =>
    sessions.rateLimit(source('192.0.2.2'), 'login', 30, 'owner@example.test'),
  );
});
