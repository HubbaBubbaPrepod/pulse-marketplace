import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { Mailer } from '../dist/auth/email.service.js';
function setup() {
  let sent;
  const renderer = nodemailer.createTransport({ jsonTransport: true });
  const mailer = new Mailer({ production: false });
  mailer.transport = {
    async sendMail(message) {
      const info = await renderer.sendMail(message);
      sent = JSON.parse(info.message);
      return info;
    },
  };
  return { mailer, message: () => sent };
}
test('Russian account emails preserve recipient and use localized action text', async () => {
  const { mailer, message } = setup();
  await mailer.send(
    'reader@example.test',
    'https://market.example/ru/verify-email/?token=test',
    'verify',
    'ru',
  );
  const result = message();
  assert.equal(result.subject, 'Подтвердите email в Pulse Marketplace');
  assert.match(result.text, /Подтвердите email/);
  assert.match(result.text, /https:\/\/market\.example\/ru\/verify-email\/\?token=test/);
  assert.equal(result.to.length, 1);
  assert.equal(result.to[0].address, 'reader@example.test');
});
test('mailer rejects recipient header injection before message delivery', async () => {
  const { mailer } = setup();
  await assert.rejects(() =>
    mailer.send(
      'reader@example.test\r\nBcc: other@example.test',
      'https://market.example/',
      'reset',
      'en',
    ),
  );
});
