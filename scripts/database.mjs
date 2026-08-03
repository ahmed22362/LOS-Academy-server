import 'dotenv/config';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const [action, file] = process.argv.slice(2);

function run(command, args, databaseUrl) {
  const url = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new Error('Database URL must use postgres:// or postgresql://');
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PGHOST: url.hostname,
      PGPORT: url.port || '5432',
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (action === 'backup') {
  const databaseUrl =
    process.env.BACKUP_POSTGRESQL_DB_URL ??
    process.env.PRODUCTION_POSTGRESQL_BD_URL;
  if (!databaseUrl) throw new Error('Set PRODUCTION_POSTGRESQL_BD_URL in .env');

  const archive = resolve(
    file ?? `backups/database-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`,
  );
  mkdirSync(dirname(archive), { recursive: true });
  run(
    'pg_dump',
    ['--format=custom', '--schema=public', '--no-owner', '--no-acl', '--file', archive],
    databaseUrl,
  );
  console.log(`Backup saved to ${archive}`);
} else if (action === 'restore') {
  if (!file) throw new Error('Usage: npm run db:restore -- <backup.dump>');
  if (!existsSync(file)) throw new Error(`Backup not found: ${file}`);
  const databaseUrl = process.env.RESTORE_POSTGRESQL_DB_URL;
  if (!databaseUrl) throw new Error('Set RESTORE_POSTGRESQL_DB_URL to the target database');

  run(
    'pg_restore',
    ['--clean', '--if-exists', '--no-owner', '--no-acl', '--exit-on-error', file],
    databaseUrl,
  );
  console.log(`Backup restored from ${resolve(file)}`);
} else {
  throw new Error('Usage: npm run db:backup -- [backup.dump] | npm run db:restore -- <backup.dump>');
}
