import { createClient } from '@libsql/client'
import { DatabaseSync } from 'node:sqlite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

process.loadEnvFile?.('.env')

const sourcePath = resolve(process.argv[2] || 'data/vilno.sqlite')
const url = process.env.STORAGE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL
const authToken = process.env.STORAGE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) throw new Error('Set STORAGE_TURSO_DATABASE_URL and STORAGE_TURSO_AUTH_TOKEN.')
if (!existsSync(sourcePath)) throw new Error(`Local SQLite database not found: ${sourcePath}`)

const source = new DatabaseSync(sourcePath, { readOnly: true })
const target = createClient({ url, authToken })
const tables = ['attempts', 'milestone_acknowledgements', 'mutation_receipts', 'daily_wisdom_reads']

try {
  await target.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)')
  await target.batch([
    `CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, ended_at INTEGER, start_timezone TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      CHECK (ended_at IS NULL OR ended_at >= started_at)
    )`,
    'CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON attempts((1)) WHERE ended_at IS NULL',
    `CREATE TABLE IF NOT EXISTS milestone_acknowledgements (
      attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE, milestone_days INTEGER NOT NULL,
      acknowledged_at INTEGER NOT NULL, PRIMARY KEY (attempt_id, milestone_days)
    )`,
    `CREATE TABLE IF NOT EXISTS mutation_receipts (
      request_id TEXT PRIMARY KEY, operation TEXT NOT NULL, payload_hash TEXT NOT NULL,
      response_json TEXT NOT NULL, created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS daily_wisdom_reads (
      local_date TEXT NOT NULL, wisdom_id TEXT NOT NULL, read_at INTEGER NOT NULL,
      PRIMARY KEY (local_date, wisdom_id)
    )`,
    { sql: 'INSERT OR IGNORE INTO schema_migrations VALUES (?, ?)', args: [1, Date.now()] },
    { sql: 'INSERT OR IGNORE INTO schema_migrations VALUES (?, ?)', args: [2, Date.now()] },
  ], 'write')

  const targetCounts = await Promise.all(tables.map(async (table) => Number((await target.execute(`SELECT COUNT(*) AS count FROM ${table}`)).rows[0].count)))
  if (targetCounts.some(Boolean)) {
    throw new Error('Turso already contains tracker data. Migration stopped to prevent overwriting or duplicating records.')
  }

  const sourceTables = new Set(source.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => String(row.name)))
  const rows = {
    attempts: sourceTables.has('attempts') ? source.prepare('SELECT id, started_at, ended_at, start_timezone, version, created_at, updated_at FROM attempts').all() : [],
    milestone_acknowledgements: sourceTables.has('milestone_acknowledgements') ? source.prepare('SELECT attempt_id, milestone_days, acknowledged_at FROM milestone_acknowledgements').all() : [],
    mutation_receipts: sourceTables.has('mutation_receipts') ? source.prepare('SELECT request_id, operation, payload_hash, response_json, created_at FROM mutation_receipts').all() : [],
    daily_wisdom_reads: sourceTables.has('daily_wisdom_reads') ? source.prepare('SELECT local_date, wisdom_id, read_at FROM daily_wisdom_reads').all() : [],
  }

  const statements = [
    ...rows.attempts.map((row) => ({ sql: 'INSERT INTO attempts VALUES (?, ?, ?, ?, ?, ?, ?)', args: [row.id, row.started_at, row.ended_at, row.start_timezone, row.version, row.created_at, row.updated_at] })),
    ...rows.milestone_acknowledgements.map((row) => ({ sql: 'INSERT INTO milestone_acknowledgements VALUES (?, ?, ?)', args: [row.attempt_id, row.milestone_days, row.acknowledged_at] })),
    ...rows.mutation_receipts.map((row) => ({ sql: 'INSERT INTO mutation_receipts VALUES (?, ?, ?, ?, ?)', args: [row.request_id, row.operation, row.payload_hash, row.response_json, row.created_at] })),
    ...rows.daily_wisdom_reads.map((row) => ({ sql: 'INSERT INTO daily_wisdom_reads VALUES (?, ?, ?)', args: [row.local_date, row.wisdom_id, row.read_at] })),
  ]
  for (let index = 0; index < statements.length; index += 100) await target.batch(statements.slice(index, index + 100), 'write')

  const summary = Object.fromEntries(tables.map((table) => [table, rows[table].length]))
  console.log(`Migrated local tracker data to Turso: ${JSON.stringify(summary)}`)
} finally {
  source.close()
  target.close()
}
