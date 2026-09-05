import { createClient, type Client, type InStatement, type Transaction } from '@libsql/client'
import { createHash, randomUUID } from 'node:crypto'
import type { Attempt, DailyWisdomState, TrackerState } from './types'
import { dateKeyInTimezone, wisdomForDate } from './wisdom'

type Executor = Pick<Client, 'execute'> | Transaction

let database: Client | undefined
let initialization: Promise<void> | undefined

function databaseConfig() {
  const url = process.env.STORAGE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL
  const authToken = process.env.STORAGE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) {
    throw createError({ statusCode: 503, statusMessage: 'Сховище трекера ще не налаштоване.' })
  }
  return { url, authToken }
}

function client() {
  if (!database) database = createClient(databaseConfig())
  return database
}

async function getDb() {
  if (!initialization) initialization = initialize(client())
  await initialization
  return client()
}

async function initialize(db: Client) {
  await db.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)')
  const migrations: InStatement[][] = [
    [
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
    ],
    [
      `CREATE TABLE IF NOT EXISTS daily_wisdom_reads (
        local_date TEXT NOT NULL, wisdom_id TEXT NOT NULL, read_at INTEGER NOT NULL,
        PRIMARY KEY (local_date, wisdom_id)
      )`,
    ],
  ]
  const applied = await db.execute('SELECT version FROM schema_migrations')
  const seen = new Set(applied.rows.map((row) => Number(row.version)))
  for (const [index, statements] of migrations.entries()) {
    const version = index + 1
    if (seen.has(version)) continue
    await db.batch([...statements, { sql: 'INSERT OR IGNORE INTO schema_migrations VALUES (?, ?)', args: [version, Date.now()] }], 'write')
  }
}

function rowToAttempt(row: Record<string, unknown>): Attempt {
  return {
    id: String(row.id),
    startedAt: Number(row.started_at),
    endedAt: row.ended_at === null ? null : Number(row.ended_at),
    startTimezone: String(row.start_timezone),
    version: Number(row.version),
  }
}

async function trackerStateFrom(db: Executor): Promise<TrackerState> {
  const active = (await db.execute('SELECT * FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined
  const history = (await db.execute('SELECT * FROM attempts WHERE ended_at IS NOT NULL ORDER BY ended_at DESC')).rows as Record<string, unknown>[]
  const acknowledgements = active
    ? (await db.execute({ sql: 'SELECT milestone_days FROM milestone_acknowledgements WHERE attempt_id = ?', args: [String(active.id)] })).rows
    : []
  return {
    serverNow: Date.now(),
    activeAttempt: active ? rowToAttempt(active) : null,
    history: history.map(rowToAttempt),
    acknowledgedMilestones: acknowledgements.map((row) => Number(row.milestone_days)),
  }
}

export async function trackerState(): Promise<TrackerState> {
  return trackerStateFrom(await getDb())
}

async function receipt<T>(db: Executor, requestId: string, operation: string, payload: unknown) {
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  const existing = (await db.execute({ sql: 'SELECT operation, payload_hash, response_json FROM mutation_receipts WHERE request_id = ?', args: [requestId] })).rows[0] as Record<string, unknown> | undefined
  if (existing) {
    if (existing.operation !== operation || existing.payload_hash !== hash) {
      throw createError({ statusCode: 409, statusMessage: 'Цей запит уже використано з іншими даними.' })
    }
    return { hash, result: JSON.parse(String(existing.response_json)) as T }
  }
  return { hash, result: null }
}

async function saveReceipt<T>(db: Executor, requestId: string, operation: string, hash: string, state: T) {
  await db.execute({ sql: 'INSERT INTO mutation_receipts VALUES (?, ?, ?, ?, ?)', args: [requestId, operation, hash, JSON.stringify(state), Date.now()] })
}

async function transaction<T>(work: (db: Transaction) => Promise<T>): Promise<T> {
  const tx = await (await getDb()).transaction('write')
  try {
    const result = await work(tx)
    await tx.commit()
    return result
  } catch (error) {
    await tx.rollback()
    throw error
  }
}

export async function createAttempt(startedAt: number, startTimezone: string, requestId: string) {
  const db = await getDb()
  const cached = await receipt<TrackerState>(db, requestId, 'create-attempt', { startedAt, startTimezone })
  if (cached.result) return cached.result
  return transaction(async (tx) => {
    const active = (await tx.execute('SELECT id FROM attempts WHERE ended_at IS NULL')).rows[0]
    if (active) throw createError({ statusCode: 409, statusMessage: 'Активна спроба вже існує.' })
    const now = Date.now()
    await tx.execute({ sql: 'INSERT INTO attempts VALUES (?, ?, NULL, ?, 1, ?, ?)', args: [randomUUID(), startedAt, startTimezone, now, now] })
    const state = await trackerStateFrom(tx)
    await saveReceipt(tx, requestId, 'create-attempt', cached.hash, state)
    return state
  })
}

export async function updateAttempt(id: string, startedAt: number, startTimezone: string, version: number, requestId: string) {
  const db = await getDb()
  const cached = await receipt<TrackerState>(db, requestId, 'update-attempt', { id, startedAt, startTimezone, version })
  if (cached.result) return cached.result
  return transaction(async (tx) => {
    const result = await tx.execute({ sql: 'UPDATE attempts SET started_at = ?, start_timezone = ?, version = version + 1, updated_at = ? WHERE id = ? AND ended_at IS NULL AND version = ?', args: [startedAt, startTimezone, Date.now(), id, version] })
    if (Number(result.rowsAffected) !== 1) throw createError({ statusCode: 409, statusMessage: 'Дані змінилися в іншому вікні. Оновіть сторінку.' })
    const state = await trackerStateFrom(tx)
    await saveReceipt(tx, requestId, 'update-attempt', cached.hash, state)
    return state
  })
}

export async function restartAttempt(requestId: string) {
  const db = await getDb()
  const cached = await receipt<TrackerState>(db, requestId, 'restart-attempt', {})
  if (cached.result) return cached.result
  return transaction(async (tx) => {
    const now = Date.now()
    const active = (await tx.execute('SELECT id FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined
    if (!active) throw createError({ statusCode: 409, statusMessage: 'Немає активної спроби.' })
    await tx.execute({ sql: 'UPDATE attempts SET ended_at = ?, version = version + 1, updated_at = ? WHERE id = ?', args: [now, now, String(active.id)] })
    await tx.execute({ sql: 'INSERT INTO attempts VALUES (?, ?, NULL, ?, 1, ?, ?)', args: [randomUUID(), now, Intl.DateTimeFormat().resolvedOptions().timeZone, now, now] })
    const state = await trackerStateFrom(tx)
    await saveReceipt(tx, requestId, 'restart-attempt', cached.hash, state)
    return state
  })
}

export async function deleteHistoryAttempt(id: string, requestId: string) {
  const db = await getDb()
  const cached = await receipt<TrackerState>(db, requestId, 'delete-history-attempt', { id })
  if (cached.result) return cached.result
  return transaction(async (tx) => {
    await tx.execute({ sql: 'DELETE FROM milestone_acknowledgements WHERE attempt_id = ?', args: [id] })
    const result = await tx.execute({ sql: 'DELETE FROM attempts WHERE id = ? AND ended_at IS NOT NULL', args: [id] })
    if (Number(result.rowsAffected) !== 1) throw createError({ statusCode: 404, statusMessage: 'Завершену спробу не знайдено.' })
    const state = await trackerStateFrom(tx)
    await saveReceipt(tx, requestId, 'delete-history-attempt', cached.hash, state)
    return state
  })
}

export async function acknowledgeMilestones(days: number[], requestId: string) {
  const db = await getDb()
  const cached = await receipt<TrackerState>(db, requestId, 'acknowledge-milestones', { days })
  if (cached.result) return cached.result
  return transaction(async (tx) => {
    const active = (await tx.execute('SELECT id FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined
    if (!active) throw createError({ statusCode: 409, statusMessage: 'Немає активної спроби.' })
    for (const day of days) {
      await tx.execute({ sql: 'INSERT OR IGNORE INTO milestone_acknowledgements VALUES (?, ?, ?)', args: [String(active.id), day, Date.now()] })
    }
    const state = await trackerStateFrom(tx)
    await saveReceipt(tx, requestId, 'acknowledge-milestones', cached.hash, state)
    return state
  })
}

export async function dailyWisdom(timezone: string): Promise<DailyWisdomState> {
  const date = dateKeyInTimezone(timezone)
  const wisdom = wisdomForDate(date)
  const row = (await (await getDb()).execute({ sql: 'SELECT read_at FROM daily_wisdom_reads WHERE local_date = ? AND wisdom_id = ?', args: [date, wisdom.id] })).rows[0] as Record<string, unknown> | undefined
  return { serverNow: Date.now(), date, timezone, wisdom, readAt: row ? Number(row.read_at) : null }
}

export async function markWisdomRead(localDate: string, wisdomId: string, timezone: string, requestId: string) {
  const db = await getDb()
  const cached = await receipt<DailyWisdomState>(db, requestId, 'mark-wisdom-read', { localDate, wisdomId, timezone })
  if (cached.result) return cached.result
  const today = dateKeyInTimezone(timezone)
  if (localDate > today || wisdomForDate(localDate).id !== wisdomId) {
    throw createError({ statusCode: 400, statusMessage: 'Ця картка не відповідає обраній даті.' })
  }
  return transaction(async (tx) => {
    await tx.execute({ sql: 'INSERT OR IGNORE INTO daily_wisdom_reads VALUES (?, ?, ?)', args: [localDate, wisdomId, Date.now()] })
    const row = (await tx.execute({ sql: 'SELECT read_at FROM daily_wisdom_reads WHERE local_date = ? AND wisdom_id = ?', args: [localDate, wisdomId] })).rows[0] as Record<string, unknown>
    const result: DailyWisdomState = { serverNow: Date.now(), date: localDate, timezone, wisdom: wisdomForDate(localDate), readAt: Number(row.read_at) }
    await saveReceipt(tx, requestId, 'mark-wisdom-read', cached.hash, result)
    return result
  })
}

export function closeDbForTests() {
  database?.close()
  database = undefined
  initialization = undefined
}
