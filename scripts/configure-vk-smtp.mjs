import { readFile, writeFile, chmod } from 'node:fs/promises';
import nodemailer from 'nodemailer';
const passwordPath = new URL('../artifacts/vk-smtp-password.txt', import.meta.url);
const envPath = new URL('../.env', import.meta.url);
try {
  const password = (await readFile(passwordPath, 'utf8')).trim();
  if (!password || /[\r\n]/.test(password)) throw new Error('INVALID_SECRET_FILE');
  const user = 'noreply@hubba-cloud.ru';
  const transport = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: { user, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  try {
    await transport.verify();
  } finally {
    transport.close();
  }
  let content = await readFile(envPath, 'utf8');
  for (const [key, value] of Object.entries({
    SMTP_URL: `smtps://${encodeURIComponent(user)}:${encodeURIComponent(password)}@smtp.mail.ru:465`,
    MAIL_FROM: `Pulse Marketplace <${user}>`,
  })) {
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    content = pattern.test(content)
      ? content.replace(pattern, () => `${key}=${value}`)
      : content + `\n${key}=${value}\n`;
  }
  await writeFile(envPath, content, { mode: 0o600 });
  await chmod(passwordPath, 0o600);
  console.log(
    'VK SMTP authentication verified; existing ignored .env updated. No email sent and no password printed. Restart the API to load settings.',
  );
} catch (error) {
  console.error(
    error.code === 'ENOENT'
      ? 'Create artifacts/vk-smtp-password.txt with the noreply mailbox app password first.'
      : error.code === 'EAUTH'
        ? 'VK rejected SMTP authentication. Check the mailbox app password and external SMTP access.'
        : 'SMTP configuration failed. Existing settings were preserved if verification failed.',
  );
  process.exitCode = 1;
}
