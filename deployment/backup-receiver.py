"""Receive verified backup pairs using a forced-command SSH key, without a shell."""
import datetime as dt
import hashlib
import os
from pathlib import Path
import re
import shutil
import sys
import tarfile
import tempfile

NAMES = {'database.dump', 'packages.tar.gz', 'SHA256SUMS'}
MAX_BYTES = 10 * 1024**3
STAMP = re.compile(r'marketplace-[0-9]{8}T[0-9]{6}Z$')

def prune(root, days):
    root = Path(root).resolve(strict=True)
    entries = sorted((p for p in root.iterdir() if STAMP.fullmatch(p.name) and p.is_dir() and not p.is_symlink()), reverse=True)
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    for path in entries[2:]:
        date = dt.datetime.strptime(path.name, 'marketplace-%Y%m%dT%H%M%SZ').replace(tzinfo=dt.timezone.utc)
        if date < cutoff and path.resolve().parent == root:
            shutil.rmtree(path)

def receive(stream, root):
    root = Path(root).resolve(strict=True)
    temporary = Path(tempfile.mkdtemp(prefix='.incoming-', dir=root))
    try:
        budget = min(MAX_BYTES, shutil.disk_usage(root).free - 2 * 1024**3)
        seen = set()
        total = 0
        with tarfile.open(fileobj=stream, mode='r|') as archive:
            for member in archive:
                total += member.size
                if member.name not in NAMES or member.name in seen or not member.isfile() or member.size < 1 or total > budget or (member.name == 'SHA256SUMS' and member.size > 1024):
                    raise ValueError('Unexpected or oversized backup entry')
                seen.add(member.name)
                source = archive.extractfile(member)
                with (temporary/member.name).open('xb') as target:
                    shutil.copyfileobj(source, target, length=1024*1024)
                    target.flush(); os.fsync(target.fileno())
        if seen != NAMES:
            raise ValueError('Incomplete backup pair')
        checks = {}
        for line in (temporary/'SHA256SUMS').read_text(encoding='ascii').splitlines():
            match = re.fullmatch(r'([a-f0-9]{64})  (database\.dump|packages\.tar\.gz)', line)
            if not match or match[2] in checks:
                raise ValueError('Invalid checksums')
            checks[match[2]] = match[1]
        if set(checks) != NAMES-{'SHA256SUMS'}:
            raise ValueError('Missing checksums')
        for name, expected in checks.items():
            with (temporary/name).open('rb') as value:
                digest = hashlib.sha256()
                for chunk in iter(lambda: value.read(1024*1024), b''):
                    digest.update(chunk)
                actual = digest.hexdigest()
            if actual != expected:
                raise ValueError('Backup checksum mismatch')
        final = root/dt.datetime.now(dt.timezone.utc).strftime('marketplace-%Y%m%dT%H%M%SZ')
        if final.exists():
            raise ValueError('Backup timestamp already exists')
        temporary.rename(final)
        prune(root, 30)
        return final
    except (tarfile.TarError, UnicodeError) as error:
        raise ValueError('Invalid backup stream') from error
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)

if __name__ == '__main__':
    os.umask(0o077)
    if len(sys.argv) == 3 and sys.argv[1] == '--prune':
        prune(sys.argv[2], 14)
    elif len(sys.argv) == 2:
        import fcntl
        with (Path(sys.argv[1])/'.receive.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            print(receive(sys.stdin.buffer, sys.argv[1]).name)
    else:
        raise SystemExit('Usage: backup-receiver.py [--prune] DIRECTORY')
