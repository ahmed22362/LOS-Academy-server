import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const directory = mkdtempSync(join(tmpdir(), 'los-db-script-'));
const command = join(directory, 'pg_dump');
const archive = join(directory, 'backup.dump');
writeFileSync(
  command,
  '#!/bin/sh\nprintf "%s\\n" "$@" > "$ARGS_FILE"\nprintf "%s|%s|%s|%s|%s" "$PGHOST" "$PGPORT" "$PGUSER" "$PGPASSWORD" "$PGDATABASE" > "$DATABASE_FILE"\ntouch "$6"\n',
);
chmodSync(command, 0o755);

const result = spawnSync(
  process.execPath,
  ['scripts/database.mjs', 'backup', archive],
  {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      ARGS_FILE: join(directory, 'args'),
      DATABASE_FILE: join(directory, 'database'),
      BACKUP_POSTGRESQL_DB_URL: 'postgres://student:s%40cret@example.invalid:6543/test',
    },
  },
);

assert.equal(result.status, 0, result.stderr.toString());
assert.match(readFileSync(join(directory, 'args'), 'utf8'), /--schema=public/);
assert.equal(
  readFileSync(join(directory, 'database'), 'utf8'),
  'example.invalid|6543|student|s@cret|test',
);
assert.ok(readFileSync(archive).length === 0);

const restoreCommand = join(directory, 'pg_restore');
writeFileSync(
  restoreCommand,
  '#!/bin/sh\nprintf "%s\\n" "$@" > "$ARGS_FILE"\nprintf "%s|%s|%s|%s|%s" "$PGHOST" "$PGPORT" "$PGUSER" "$PGPASSWORD" "$PGDATABASE" > "$DATABASE_FILE"\n',
);
chmodSync(restoreCommand, 0o755);
const restore = spawnSync(
  process.execPath,
  ['scripts/database.mjs', 'restore', archive],
  {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      ARGS_FILE: join(directory, 'restore-args'),
      DATABASE_FILE: join(directory, 'restore-database'),
      RESTORE_POSTGRESQL_DB_URL: 'postgres://localhost/restored',
    },
  },
);

assert.equal(restore.status, 0, restore.stderr.toString());
assert.match(readFileSync(join(directory, 'restore-args'), 'utf8'), /--clean/);
assert.equal(
  readFileSync(join(directory, 'restore-database'), 'utf8'),
  'localhost|5432|||restored',
);
