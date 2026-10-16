# Production operations / Эксплуатация

[Русский](#русский) · [English](#english)

## Русский

Публичная установка: [marketplace.hubba-cloud.ru](https://marketplace.hubba-cloud.ru/ru/).

Marketplace работает на Linux через отдельный Nginx virtual host: HTTP 80 перенаправляет на HTTPS 443. Next.js слушает `127.0.0.1:3100`, Nest.js — `127.0.0.1:3101`, PostgreSQL 18 в Docker — `127.0.0.1:54329`. Эти внутренние порты не нужно открывать в firewall. Другие сайты используют свои virtual hosts.

### Файлы и службы

- `/opt/pulse-marketplace/app` — checkout и production-сборка.
- `/opt/pulse-marketplace/node/bin/node` — Node.js для непривилегированных служб.
- `/etc/pulse-marketplace.env` — серверные секреты, доступ только root и группе службы.
- `/var/lib/pulse-marketplace/packages` — неизменяемые JSON-пакеты по SHA-256.
- Docker-том `pulse-marketplace_marketplace_database` — аккаунты, очередь, публикации, аудит и сессии.
- `pulse-marketplace-database`, `pulse-marketplace-api`, `pulse-marketplace-web` — systemd-службы с автозапуском. Приложения работают от пользователя `pulse-marketplace`.

```sh
sudo systemctl status pulse-marketplace-api pulse-marketplace-web pulse-marketplace-database
sudo journalctl -u pulse-marketplace-api -u pulse-marketplace-web --since '30 minutes ago'
curl --fail https://marketplace.hubba-cloud.ru/api/v1/health/
```

При обновлении сначала сделайте резервную копию, изучите changelog и миграции. Выполняйте `npm ci` и последовательную сборку API/web в checkout; миграции запускайте с production env. Перезапускайте только две службы приложения. Не используйте `docker compose down -v`: это удалит данные PostgreSQL. Откат кода при изменённой схеме требует отдельного плана восстановления.

### Резервные копии

`pulse-marketplace-backup.timer` ежедневно запускает `/opt/pulse-marketplace/backup.sh`. Копия в `/opt/pulse-marketplace/backups/marketplace-<UTC>` содержит `database.dump`, `packages.tar.gz` и `SHA256SUMS`; `backups/latest` указывает на последнюю копию. Копии содержат чувствительные данные и доступны только root. Автоматического удаления старых копий пока нет: следите за местом. Это копии на том же сервере; для защиты от потери диска переносите их в отдельное хранилище.

```sh
sudo systemctl start pulse-marketplace-backup.service
sudo systemctl list-timers pulse-marketplace-backup.timer
```

Для проверки восстановления используйте отдельную пустую базу PostgreSQL 18. Проверьте `sha256sum -c SHA256SUMS`, восстановите dump через `pg_restore --single-transaction --exit-on-error --no-owner --no-privileges`, извлеките пакеты в отдельную директорию и сравните их SHA-256 с именами файлов. Только после проверки количества аккаунтов, публикаций и файлов планируйте переключение. Не восстанавливайте поверх рабочей базы. При первом переносе проверено реальное восстановление обеих частей; временные сессии локальной установки не переносились.

### HTTPS и вход

DNS: A-запись `marketplace` указывает на публичный IPv4 сервера. Сертификат Let's Encrypt использует HTTP-01 webroot `/var/www/pulse-marketplace-acme`; порт 80 и `/.well-known/acme-challenge/` должны оставаться доступными. `certbot.timer` продлевает сертификат; отдельный deploy hook проверяет и перезагружает Nginx после продления сертификата Marketplace.

```sh
sudo certbot renew --cert-name marketplace.hubba-cloud.ru --dry-run
```

GitHub OAuth callback: `https://marketplace.hubba-cloud.ru/api/v1/auth/github/callback/`. Секреты провайдера находятся только в серверном env. После переноса вход выполняется заново; прежние аккаунты сохраняются. Google, регистрация по email и сброс пароля недоступны до настройки соответствующего провайдера/SMTP. Вход существующего email-администратора работает без отправки писем.

Nginx ограничивает запросы этого virtual host до 20 запросов/с на IP с burst 60 и возвращает 429 при превышении; тело запроса ограничено 1 MiB. Access log этого хоста отключён, чтобы не сохранять OAuth-коды и одноразовые ссылки. В API остаются собственные ограничения входа и проверка Origin/CSRF.

## English

Public installation: [marketplace.hubba-cloud.ru](https://marketplace.hubba-cloud.ru/en/).

A dedicated Linux Nginx virtual host redirects HTTP 80 to HTTPS 443. Next.js binds to `127.0.0.1:3100`, Nest.js to `127.0.0.1:3101`, and Docker PostgreSQL 18 to `127.0.0.1:54329`. Keep these internal ports closed externally. Existing sites retain their own virtual hosts.

### Files and services

- `/opt/pulse-marketplace/app`: checkout and production build.
- `/opt/pulse-marketplace/node/bin/node`: Node.js executable for the unprivileged services.
- `/etc/pulse-marketplace.env`: backend secrets, readable by root and the service group only.
- `/var/lib/pulse-marketplace/packages`: immutable JSON snapshots addressed by SHA-256.
- Docker volume `pulse-marketplace_marketplace_database`: accounts, jobs, publications, audit and sessions.
- `pulse-marketplace-database`, `pulse-marketplace-api`, `pulse-marketplace-web`: enabled systemd services. Application processes run as `pulse-marketplace`.

Use the status, journal and health commands above for diagnostics. Before updating, back up the database/packages and review migrations. Run `npm ci`, build the API and web sequentially, apply migrations with the production environment, then restart only the two application services. Never run `docker compose down -v`; it deletes the database. Rolling back code after a schema change requires a separate recovery plan.

### Backups

`pulse-marketplace-backup.timer` runs `/opt/pulse-marketplace/backup.sh` daily. Each root-only directory under `/opt/pulse-marketplace/backups/marketplace-<UTC>` contains `database.dump`, `packages.tar.gz` and `SHA256SUMS`. `backups/latest` records the latest path. Backups contain sensitive data. Retention is currently manual; monitor disk usage. These backups share the application server: copy them to independent storage to survive disk loss.

Verify checksums, restore with PostgreSQL 18 `pg_restore --single-transaction --exit-on-error --no-owner --no-privileges` into a separate empty database, unpack snapshots separately, and verify each file against its SHA-256 filename. Compare accounts/publications/files before planning a switch. Never restore over the live database. A real restore of both parts was checked during initial deployment; local temporary authentication records were excluded from the migration.

### HTTPS and authentication

The `marketplace` A record points to the server's public IPv4. Let's Encrypt HTTP-01 uses `/var/www/pulse-marketplace-acme`; keep port 80 and the challenge route reachable. `certbot.timer` handles renewal. A dedicated deployment hook validates/reloads Nginx after Marketplace certificate renewal. Use the dry-run command above to verify renewal.

Configure the GitHub callback as `https://marketplace.hubba-cloud.ru/api/v1/auth/github/callback/`. Provider secrets stay in the backend environment. Existing accounts are preserved; sign in again after migration. Google, email registration and password recovery remain unavailable until their provider/SMTP is configured. Existing administrator password sign-in does not require email delivery.

This virtual host limits traffic to 20 requests/second per IP with burst 60 and returns 429 above that limit; request bodies are capped at 1 MiB. Access logging is disabled to avoid retaining OAuth codes and one-time links. API authentication throttling and Origin/CSRF checks remain active.
