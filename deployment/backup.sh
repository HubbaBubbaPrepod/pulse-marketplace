#!/bin/sh
set -eu
umask 077
exec 9>/run/lock/pulse-marketplace-backup.lock
flock -n 9 || exit 0
cd /opt/pulse-marketplace/app
container=$(docker compose --env-file /etc/pulse-marketplace.env -f deployment/compose.yml ps -q database)
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target=/opt/pulse-marketplace/backups/marketplace-$stamp
mkdir -m 0700 "$target"
docker exec "$container" pg_dump -U pulse_marketplace -d pulse_marketplace -Fc > "$target/database.dump"
tar -C /var/lib/pulse-marketplace -czf "$target/packages.tar.gz" packages
docker exec -i "$container" pg_restore --list < "$target/database.dump" >/dev/null
tar -tzf "$target/packages.tar.gz" >/dev/null
(cd "$target" && sha256sum database.dump packages.tar.gz > SHA256SUMS && sha256sum -c SHA256SUMS)
tar -C "$target" -cf - database.dump packages.tar.gz SHA256SUMS | ssh -F /etc/pulse-marketplace-backup/ssh_config -T pulse-marketplace-offsite
printf '%s\n' "$target" > /opt/pulse-marketplace/backups/latest
python3 /opt/pulse-marketplace/backup-receiver.py --prune /opt/pulse-marketplace/backups
