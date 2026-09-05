import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import type { Attempt, DailyWisdomState, TrackerState } from './types'
import { dateKeyInTimezone, wisdomForDate } from './wisdom'

let database: DatabaseSync | undefined

function getDb() {
  if (database) return database
  const config = useRuntimeConfig()
  mkdirSync(dirname(config.databasePath), { recursive: true })
  database = new DatabaseSync(config.databasePath)
  database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;')
  database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);')
  const migrations = [
    `
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, ended_at INTEGER, start_timezone TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      CHECK (ended_at IS NULL OR ended_at >= started_at)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON attempts((1)) WHERE ended_at IS NULL;
    CREATE TABLE IF NOT EXISTS milestone_acknowledgements (
      attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE, milestone_days INTEGER NOT NULL,
      acknowledged_at INTEGER NOT NULL, PRIMARY KEY (attempt_id, milestone_days)
    );
    CREATE TABLE IF NOT EXISTS mutation_receipts (
      request_id TEXT PRIMARY KEY, operation TEXT NOT NULL, payload_hash TEXT NOT NULL, response_json TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS daily_wisdom_reads (
      local_date TEXT NOT NULL,
      wisdom_id TEXT NOT NULL,
      read_at INTEGER NOT NULL,
      PRIMARY KEY (local_date, wisdom_id)
    );
    `,
  ]
  const applied = database.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]
  const seen = new Set(applied.map((row) => Number(row.version)))
  migrations.forEach((sql, index) => {
    const version = index + 1
    if (seen.has(version)) return
    database!.exec('BEGIN IMMEDIATE')
    try {
      database!.exec(sql)
      database!.prepare('INSERT INTO schema_migrations VALUES (?, ?)').run(version, Date.now())
      database!.exec('COMMIT')
    } catch (error) {
      database!.exec('ROLLBACK')
      throw error
    }
  })
  return database
}

function rowToAttempt(row: Record<string, unknown>): Attempt {
  return { id: String(row.id), startedAt: Number(row.started_at), endedAt: row.ended_at === null ? null : Number(row.ended_at), startTimezone: String(row.start_timezone), version: Number(row.version) }
}

export function trackerState(): TrackerState {
  const db = getDb()
  const active = db.prepare('SELECT * FROM attempts WHERE ended_at IS NULL').get() as Record<string, unknown> | undefined
  const history = db.prepare('SELECT * FROM attempts WHERE ended_at IS NOT NULL ORDER BY ended_at DESC').all() as Record<string, unknown>[]
  const acknowledgements = active ? db.prepare('SELECT milestone_days FROM milestone_acknowledgements WHERE attempt_id = ?').all(String(active.id)) as Record<string, unknown>[] : []
  return { serverNow: Date.now(), activeAttempt: active ? rowToAttempt(active) : null, history: history.map(rowToAttempt), acknowledgedMilestones: acknowledgements.map((row) => Number(row.milestone_days)) }
}

function receipt<T>(requestId: string, operation: string, payload: unknown) {
  const db = getDb(); const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  const existing = db.prepare('SELECT payload_hash, response_json FROM mutation_receipts WHERE request_id = ?').get(requestId) as Record<string, string> | undefined
  if (existing) {
    if (existing.payload_hash !== hash) throw createError({ statusCode: 409, statusMessage: 'Цей запит уже використано з іншими даними.' })
    return { hash, result: JSON.parse(existing.response_json!) as T }
  }
  return { hash, result: null }
}

function saveReceipt<T>(requestId: string, operation: string, hash: string, state: T) {
  getDb().prepare('INSERT INTO mutation_receipts VALUES (?, ?, ?, ?, ?)').run(requestId, operation, hash, JSON.stringify(state), Date.now())
}

function transaction<T>(work: () => T): T {
  const db = getDb()
  db.exec('BEGIN IMMEDIATE')
  try { const result = work(); db.exec('COMMIT'); return result }
  catch (error) { db.exec('ROLLBACK'); throw error }
}

export function createAttempt(startedAt: number, startTimezone: string, requestId: string) {
  const db = getDb(); const cached = receipt<TrackerState>(requestId, 'create-attempt', { startedAt, startTimezone })
  if (cached.result) return cached.result
  return transaction(() => {
    const active = db.prepare('SELECT id FROM attempts WHERE ended_at IS NULL').get()
    if (active) throw createError({ statusCode: 409, statusMessage: 'Активна спроба вже існує.' })
    const now = Date.now(); db.prepare('INSERT INTO attempts VALUES (?, ?, NULL, ?, 1, ?, ?)').run(randomUUID(), startedAt, startTimezone, now, now)
    const state = trackerState(); saveReceipt(requestId, 'create-attempt', cached.hash, state); return state
  })
}

export function updateAttempt(id: string, startedAt: number, startTimezone: string, version: number, requestId: string) {
  const db = getDb(); const cached = receipt<TrackerState>(requestId, 'update-attempt', { id, startedAt, startTimezone, version })
  if (cached.result) return cached.result
  return transaction(() => {
    const result = db.prepare('UPDATE attempts SET started_at = ?, start_timezone = ?, version = version + 1, updated_at = ? WHERE id = ? AND ended_at IS NULL AND version = ?').run(startedAt, startTimezone, Date.now(), id, version)
    if (result.changes !== 1) throw createError({ statusCode: 409, statusMessage: 'Дані змінилися в іншому вікні. Оновіть сторінку.' })
    const state = trackerState(); saveReceipt(requestId, 'update-attempt', cached.hash, state); return state
  })
}

export function restartAttempt(requestId: string) {
  const db = getDb(); const cached = receipt<TrackerState>(requestId, 'restart-attempt', {})
  if (cached.result) return cached.result
  return transaction(() => {
    const now = Date.now(); const active = db.prepare('SELECT id FROM attempts WHERE ended_at IS NULL').get() as Record<string, unknown> | undefined
    if (!active) throw createError({ statusCode: 409, statusMessage: 'Немає активної спроби.' })
    db.prepare('UPDATE attempts SET ended_at = ?, version = version + 1, updated_at = ? WHERE id = ?').run(now, now, String(active.id))
    db.prepare('INSERT INTO attempts VALUES (?, ?, NULL, ?, 1, ?, ?)').run(randomUUID(), now, Intl.DateTimeFormat().resolvedOptions().timeZone, now, now)
    const state = trackerState(); saveReceipt(requestId, 'restart-attempt', cached.hash, state); return state
  })
}

export function deleteHistoryAttempt(id: string, requestId: string) {
  const db = getDb(); const cached = receipt<TrackerState>(requestId, 'delete-history-attempt', { id })
  if (cached.result) return cached.result
  return transaction(() => {
    const result = db.prepare('DELETE FROM attempts WHERE id = ? AND ended_at IS NOT NULL').run(id)
    if (result.changes !== 1) throw createError({ statusCode: 404, statusMessage: 'Завершену спробу не знайдено.' })
    const state = trackerState(); saveReceipt(requestId, 'delete-history-attempt', cached.hash, state); return state
  })
}

export function acknowledgeMilestones(days: number[], requestId: string) {
  const db = getDb(); const cached = receipt<TrackerState>(requestId, 'acknowledge-milestones', { days })
  if (cached.result) return cached.result
  return transaction(() => {
    const active = db.prepare('SELECT id FROM attempts WHERE ended_at IS NULL').get() as Record<string, unknown> | undefined
    if (!active) throw createError({ statusCode: 409, statusMessage: 'Немає активної спроби.' })
    const statement = db.prepare('INSERT OR IGNORE INTO milestone_acknowledgements VALUES (?, ?, ?)')
    for (const day of days) statement.run(String(active.id), day, Date.now())
    const state = trackerState(); saveReceipt(requestId, 'acknowledge-milestones', cached.hash, state); return state
  })
}

export function dailyWisdom(timezone: string): DailyWisdomState {
  const date = dateKeyInTimezone(timezone)
  const wisdom = wisdomForDate(date)
  const row = getDb().prepare('SELECT read_at FROM daily_wisdom_reads WHERE local_date = ? AND wisdom_id = ?').get(date, wisdom.id) as { read_at: number } | undefined
  return { serverNow: Date.now(), date, timezone, wisdom, readAt: row ? Number(row.read_at) : null }
}

export function markWisdomRead(localDate: string, wisdomId: string, timezone: string, requestId: string) {
  const cached = receipt<DailyWisdomState>(requestId, 'mark-wisdom-read', { localDate, wisdomId, timezone })
  if (cached.result) return cached.result
  const today = dateKeyInTimezone(timezone)
  if (localDate > today || wisdomForDate(localDate).id !== wisdomId) {
    throw createError({ statusCode: 400, statusMessage: 'Ця картка не відповідає обраній даті.' })
  }
  return transaction(() => {
    getDb().prepare('INSERT OR IGNORE INTO daily_wisdom_reads VALUES (?, ?, ?)').run(localDate, wisdomId, Date.now())
    const row = getDb().prepare('SELECT read_at FROM daily_wisdom_reads WHERE local_date = ? AND wisdom_id = ?').get(localDate, wisdomId) as { read_at: number }
    const result: DailyWisdomState = { serverNow: Date.now(), date: localDate, timezone, wisdom: wisdomForDate(localDate), readAt: Number(row.read_at) }
    saveReceipt(requestId, 'mark-wisdom-read', cached.hash, result)
    return result
  })
}

export function closeDbForTests() { database?.close(); database = undefined }
