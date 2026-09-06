import { createClient, type Client, type InStatement, type Transaction } from '@libsql/client'
import { createHash, randomUUID } from 'node:crypto'
import type { Attempt, DailyWisdomState, TrackerSettings, TrackerState, TriggerInsight } from './types'
import { savedMoney } from './types'
import { dateKeyInTimezone, wisdomForDate } from './wisdom'
import { practiceForDate } from './practice'
import { selectCravingInsight } from './insights'

type Executor = Pick<Client, 'execute'> | Transaction
type Trigger = 'stress' | 'coffee' | 'alcohol' | 'after_food' | 'company' | 'boredom' | 'habit' | 'other'
const DEFAULT_COST = 7
const DEFAULT_SETTINGS: TrackerSettings = { personalReason: null, dailySmokingCost: DEFAULT_COST, currency: 'EUR' }
let database: Client | undefined
let initialization: Promise<void> | undefined

function databaseConfig() {
  const url = process.env.STORAGE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL
  const authToken = process.env.STORAGE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) throw createError({ statusCode: 503, statusMessage: 'Сховище трекера ще не налаштоване.' })
  return { url, authToken }
}
function client() { if (!database) database = createClient(databaseConfig()); return database }
async function getDb() { if (!initialization) initialization = initialize(client()); await initialization; return client() }

async function initialize(db: Client) {
  await db.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)')
  const migrations: InStatement[][] = [
    [`CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, ended_at INTEGER, start_timezone TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, CHECK (ended_at IS NULL OR ended_at >= started_at))`, 'CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON attempts((1)) WHERE ended_at IS NULL', `CREATE TABLE IF NOT EXISTS milestone_acknowledgements (attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE, milestone_days INTEGER NOT NULL, acknowledged_at INTEGER NOT NULL, PRIMARY KEY (attempt_id, milestone_days))`, `CREATE TABLE IF NOT EXISTS mutation_receipts (request_id TEXT PRIMARY KEY, operation TEXT NOT NULL, payload_hash TEXT NOT NULL, response_json TEXT NOT NULL, created_at INTEGER NOT NULL)`],
    [`CREATE TABLE IF NOT EXISTS daily_wisdom_reads (local_date TEXT NOT NULL, wisdom_id TEXT NOT NULL, read_at INTEGER NOT NULL, PRIMARY KEY (local_date, wisdom_id))`],
    [
      'ALTER TABLE attempts ADD COLUMN daily_smoking_cost_at_start REAL',
      'ALTER TABLE attempts ADD COLUMN final_saved_money REAL',
      `CREATE TABLE IF NOT EXISTS tracker_settings (id INTEGER PRIMARY KEY CHECK (id = 1), personal_reason TEXT, daily_smoking_cost REAL NOT NULL DEFAULT 7, currency TEXT NOT NULL DEFAULT 'EUR', updated_at INTEGER NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS craving_events (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, trigger_key TEXT NOT NULL, attempt_id TEXT REFERENCES attempts(id) ON DELETE SET NULL, period_day INTEGER NOT NULL, rank_key TEXT, CHECK (trigger_key IN ('stress','coffee','alcohol','after_food','company','boredom','habit','other')))` ,
      'CREATE INDEX IF NOT EXISTS craving_events_recent ON craving_events(created_at DESC)',
      { sql: 'UPDATE attempts SET daily_smoking_cost_at_start = ? WHERE daily_smoking_cost_at_start IS NULL', args: [DEFAULT_COST] },
      { sql: 'UPDATE attempts SET final_saved_money = MAX(0, ended_at - started_at) / 86400000.0 * COALESCE(daily_smoking_cost_at_start, ?) WHERE ended_at IS NOT NULL AND final_saved_money IS NULL', args: [DEFAULT_COST] },
    ],
    [
      'ALTER TABLE craving_events ADD COLUMN intensity INTEGER CHECK (intensity IS NULL OR (intensity BETWEEN 1 AND 5))',
      'ALTER TABLE craving_events ADD COLUMN coping_method TEXT',
    ],
  ]
  const applied = await db.execute('SELECT version FROM schema_migrations')
  const seen = new Set(applied.rows.map(row => Number(row.version)))
  for (const [index, statements] of migrations.entries()) {
    const version = index + 1
    if (!seen.has(version)) await db.batch([...statements, { sql: 'INSERT OR IGNORE INTO schema_migrations VALUES (?, ?)', args: [version, Date.now()] }], 'write')
  }
  await db.execute({ sql: 'INSERT OR IGNORE INTO tracker_settings (id, personal_reason, daily_smoking_cost, currency, updated_at) VALUES (1, NULL, ?, ?, ?)', args: [DEFAULT_COST, 'EUR', Date.now()] })
}

function rowToAttempt(row: Record<string, unknown>): Attempt {
  return { id: String(row.id), startedAt: Number(row.started_at), endedAt: row.ended_at === null ? null : Number(row.ended_at), startTimezone: String(row.start_timezone), version: Number(row.version), dailySmokingCostAtStart: Number(row.daily_smoking_cost_at_start ?? DEFAULT_COST), finalSavedMoney: row.final_saved_money === null || row.final_saved_money === undefined ? null : Number(row.final_saved_money) }
}
export function rowToSettings(row?: Record<string, unknown>): TrackerSettings {
  if (!row) return DEFAULT_SETTINGS
  const rawCost = row.daily_smoking_cost
  const parsedCost = rawCost === null || rawCost === undefined ? DEFAULT_COST : Number(rawCost)
  const dailySmokingCost = Number.isFinite(parsedCost) && parsedCost >= 0 ? parsedCost : DEFAULT_COST
  return {
    personalReason: row.personal_reason === null || row.personal_reason === undefined ? null : String(row.personal_reason),
    dailySmokingCost,
    currency: 'EUR',
  }
}
async function settingsFrom(db: Executor) { return rowToSettings((await db.execute('SELECT * FROM tracker_settings WHERE id = 1')).rows[0] as Record<string, unknown> | undefined) }
async function insightFrom(db: Executor): Promise<TriggerInsight | null> {
  const rows = (await db.execute({ sql: 'SELECT trigger_key, intensity, coping_method FROM craving_events WHERE created_at >= ? ORDER BY created_at DESC', args: [Date.now() - 30 * 86_400_000] })).rows as Record<string, unknown>[]
  return selectCravingInsight(rows.map(row => ({
    trigger: String(row.trigger_key),
    intensity: row.intensity === null || row.intensity === undefined ? null : Number(row.intensity),
    copingMethod: row.coping_method === null || row.coping_method === undefined ? null : String(row.coping_method),
  })))
}
async function trackerStateFrom(db: Executor): Promise<TrackerState> {
  const active = (await db.execute('SELECT * FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined
  const history = (await db.execute('SELECT * FROM attempts WHERE ended_at IS NOT NULL ORDER BY ended_at DESC')).rows as Record<string, unknown>[]
  const acknowledgements = active ? (await db.execute({ sql: 'SELECT milestone_days FROM milestone_acknowledgements WHERE attempt_id = ?', args: [String(active.id)] })).rows : []
  return { serverNow: Date.now(), activeAttempt: active ? rowToAttempt(active) : null, history: history.map(rowToAttempt), acknowledgedMilestones: acknowledgements.map(row => Number(row.milestone_days)), settings: await settingsFrom(db), triggerInsight: await insightFrom(db) }
}
export async function trackerState() { return trackerStateFrom(await getDb()) }

async function receipt<T>(db: Executor, requestId: string, operation: string, payload: unknown) {
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  const existing = (await db.execute({ sql: 'SELECT operation, payload_hash, response_json FROM mutation_receipts WHERE request_id = ?', args: [requestId] })).rows[0] as Record<string, unknown> | undefined
  if (existing) {
    if (existing.operation !== operation || existing.payload_hash !== hash) throw createError({ statusCode: 409, statusMessage: 'Цей запит уже використано з іншими даними.' })
    return { hash, result: JSON.parse(String(existing.response_json)) as T }
  }
  return { hash, result: null }
}
async function saveReceipt<T>(db: Executor, requestId: string, operation: string, hash: string, result: T) { await db.execute({ sql: 'INSERT INTO mutation_receipts VALUES (?, ?, ?, ?, ?)', args: [requestId, operation, hash, JSON.stringify(result), Date.now()] }) }
async function transaction<T>(work: (db: Transaction) => Promise<T>) { const tx = await (await getDb()).transaction('write'); try { const result = await work(tx); await tx.commit(); return result } catch (error) { await tx.rollback(); throw error } }
async function currentCost(db: Executor) { return (await settingsFrom(db)).dailySmokingCost }
function insertAttempt(db: Executor, startedAt: number, timezone: string, cost: number) { const now = Date.now(); return db.execute({ sql: 'INSERT INTO attempts (id, started_at, ended_at, start_timezone, version, created_at, updated_at, daily_smoking_cost_at_start, final_saved_money) VALUES (?, ?, NULL, ?, 1, ?, ?, ?, NULL)', args: [randomUUID(), startedAt, timezone, now, now, cost] }) }

export async function createAttempt(startedAt: number, timezone: string, requestId: string) {
  const db = await getDb(); const cached = await receipt<TrackerState>(db, requestId, 'create-attempt', { startedAt, timezone }); if (cached.result) return cached.result
  return transaction(async tx => { if ((await tx.execute('SELECT id FROM attempts WHERE ended_at IS NULL')).rows[0]) throw createError({ statusCode: 409, statusMessage: 'Активний шлях уже існує.' }); await insertAttempt(tx, startedAt, timezone, await currentCost(tx)); const state = await trackerStateFrom(tx); await saveReceipt(tx, requestId, 'create-attempt', cached.hash, state); return state })
}
export async function updateAttempt(id: string, startedAt: number, timezone: string, version: number, requestId: string) {
  const db = await getDb(); const cached = await receipt<TrackerState>(db, requestId, 'update-attempt', { id, startedAt, timezone, version }); if (cached.result) return cached.result
  return transaction(async tx => { const result = await tx.execute({ sql: 'UPDATE attempts SET started_at = ?, start_timezone = ?, version = version + 1, updated_at = ? WHERE id = ? AND ended_at IS NULL AND version = ?', args: [startedAt, timezone, Date.now(), id, version] }); if (Number(result.rowsAffected) !== 1) throw createError({ statusCode: 409, statusMessage: 'Дані змінилися в іншому вікні. Оновіть сторінку.' }); const state = await trackerStateFrom(tx); await saveReceipt(tx, requestId, 'update-attempt', cached.hash, state); return state })
}
export async function updateSettings(personalReason: string | null, dailySmokingCost: number, requestId: string) {
  const db = await getDb(); const payload = { personalReason, dailySmokingCost }; const cached = await receipt<TrackerState>(db, requestId, 'update-settings', payload); if (cached.result) return cached.result
  return transaction(async tx => {
    const updatedAt = Date.now()
    await tx.execute({ sql: 'UPDATE tracker_settings SET personal_reason = ?, daily_smoking_cost = ?, updated_at = ? WHERE id = 1', args: [personalReason, dailySmokingCost, updatedAt] })
    await tx.execute({ sql: 'UPDATE attempts SET daily_smoking_cost_at_start = ?, updated_at = ? WHERE ended_at IS NULL', args: [dailySmokingCost, updatedAt] })
    const state = await trackerStateFrom(tx)
    await saveReceipt(tx, requestId, 'update-settings', cached.hash, state)
    return state
  })
}
async function storeTrigger(tx: Executor, trigger: Trigger, active: Attempt, timestamp: number, rankKey?: string, intensity?: number, copingMethod?: string) {
  await tx.execute({
    sql: 'INSERT INTO craving_events (id, created_at, trigger_key, attempt_id, period_day, rank_key, intensity, coping_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [randomUUID(), timestamp, trigger, active.id, Math.floor(Math.max(0, timestamp - active.startedAt) / 86_400_000), rankKey || null, intensity ?? null, copingMethod ?? null],
  })
}
export async function createCravingEvent(trigger: Trigger, rankKey: string | undefined, requestId: string, intensity?: number, copingMethod?: string) {
  const db = await getDb(); const payload = { trigger, rankKey, intensity: intensity ?? null, copingMethod: copingMethod ?? null }; const cached = await receipt<TrackerState>(db, requestId, 'create-craving-event', payload); if (cached.result) return cached.result
  return transaction(async tx => { const row = (await tx.execute('SELECT * FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined; if (!row) throw createError({ statusCode: 409, statusMessage: 'Немає активного шляху.' }); await storeTrigger(tx, trigger, rowToAttempt(row), Date.now(), rankKey, intensity, copingMethod); const state = await trackerStateFrom(tx); await saveReceipt(tx, requestId, 'create-craving-event', cached.hash, state); return state })
}
export async function newPath(startedAt: number, timezone: string, version: number, trigger: Trigger | undefined, rankKey: string | undefined, requestId: string) {
  const db = await getDb(); const payload = { startedAt, timezone, version, trigger, rankKey }; const cached = await receipt<TrackerState>(db, requestId, 'new-path', payload); if (cached.result) return cached.result
  return transaction(async tx => {
    const row = (await tx.execute('SELECT * FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined
    if (!row) throw createError({ statusCode: 409, statusMessage: 'Немає активного шляху.' })
    const active = rowToAttempt(row)
    if (active.version !== version) throw createError({ statusCode: 409, statusMessage: 'Дані змінилися в іншому вікні. Оновіть сторінку.' })
    if (startedAt < active.startedAt || startedAt > Date.now() + 2_000) throw createError({ statusCode: 400, statusMessage: 'Оберіть момент у межах поточного шляху.' })
    await tx.execute({ sql: 'UPDATE attempts SET ended_at = ?, final_saved_money = ?, version = version + 1, updated_at = ? WHERE id = ?', args: [startedAt, savedMoney(active.startedAt, active.dailySmokingCostAtStart, startedAt), Date.now(), active.id] })
    if (trigger) await storeTrigger(tx, trigger, active, startedAt, rankKey)
    await insertAttempt(tx, startedAt, timezone, await currentCost(tx))
    const state = await trackerStateFrom(tx); await saveReceipt(tx, requestId, 'new-path', cached.hash, state); return state
  })
}
export async function restartAttempt(requestId: string) {
  const db = await getDb()
  const cached = await receipt<TrackerState>(db, requestId, 'restart-attempt', {})
  if (cached.result) return cached.result

  return transaction(async (tx) => {
    const row = (await tx.execute('SELECT * FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined
    if (!row) throw createError({ statusCode: 409, statusMessage: 'Немає активного шляху.' })
    const active = rowToAttempt(row)
    const restartedAt = Date.now()
    await tx.execute({
      sql: 'UPDATE attempts SET ended_at = ?, final_saved_money = ?, version = version + 1, updated_at = ? WHERE id = ?',
      args: [restartedAt, savedMoney(active.startedAt, active.dailySmokingCostAtStart, restartedAt), restartedAt, active.id],
    })
    await insertAttempt(tx, restartedAt, active.startTimezone, await currentCost(tx))
    const state = await trackerStateFrom(tx)
    await saveReceipt(tx, requestId, 'restart-attempt', cached.hash, state)
    return state
  })
}
export async function deleteHistoryAttempt(id: string, requestId: string) {
  const db = await getDb(); const cached = await receipt<TrackerState>(db, requestId, 'delete-history-attempt', { id }); if (cached.result) return cached.result
  return transaction(async tx => { await tx.execute({ sql: 'DELETE FROM milestone_acknowledgements WHERE attempt_id = ?', args: [id] }); const result = await tx.execute({ sql: 'DELETE FROM attempts WHERE id = ? AND ended_at IS NOT NULL', args: [id] }); if (Number(result.rowsAffected) !== 1) throw createError({ statusCode: 404, statusMessage: 'Завершений запис не знайдено.' }); const state = await trackerStateFrom(tx); await saveReceipt(tx, requestId, 'delete-history-attempt', cached.hash, state); return state })
}
export async function acknowledgeMilestones(days: number[], requestId: string) {
  const db = await getDb(); const cached = await receipt<TrackerState>(db, requestId, 'acknowledge-milestones', { days }); if (cached.result) return cached.result
  return transaction(async tx => { const active = (await tx.execute('SELECT id FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined; if (!active) throw createError({ statusCode: 409, statusMessage: 'Немає активного шляху.' }); for (const day of days) await tx.execute({ sql: 'INSERT OR IGNORE INTO milestone_acknowledgements VALUES (?, ?, ?)', args: [String(active.id), day, Date.now()] }); const state = await trackerStateFrom(tx); await saveReceipt(tx, requestId, 'acknowledge-milestones', cached.hash, state); return state })
}
export async function dailyWisdom(timezone: string): Promise<DailyWisdomState> {
  const db = await getDb()
  const date = dateKeyInTimezone(timezone)
  const active = (await db.execute('SELECT * FROM attempts WHERE ended_at IS NULL')).rows[0] as Record<string, unknown> | undefined
  const history = (await db.execute('SELECT id FROM attempts WHERE ended_at IS NOT NULL LIMIT 1')).rows
  const now = Date.now()
  const elapsedDays = active ? Math.floor(Math.max(0, now - Number(active.started_at)) / 86_400_000) : 0
  const recentRestart = Boolean(active && history.length && elapsedDays <= 7)
  return { serverNow: now, date, timezone, wisdom: wisdomForDate(date, { elapsedDays, recentRestart }), practice: practiceForDate(date, elapsedDays) }
}
export async function markWisdomRead(localDate: string, wisdomId: string, timezone: string, requestId: string) {
  const db = await getDb(); const cached = await receipt<{ serverNow: number, date: string, timezone: string, wisdom: import('./wisdom').Wisdom, readAt: number }>(db, requestId, 'mark-wisdom-read', { localDate, wisdomId, timezone }); if (cached.result) return cached.result
  if (localDate > dateKeyInTimezone(timezone) || wisdomForDate(localDate).id !== wisdomId) throw createError({ statusCode: 400, statusMessage: 'Ця картка не відповідає обраній даті.' })
  return transaction(async tx => { await tx.execute({ sql: 'INSERT OR IGNORE INTO daily_wisdom_reads VALUES (?, ?, ?)', args: [localDate, wisdomId, Date.now()] }); const row = (await tx.execute({ sql: 'SELECT read_at FROM daily_wisdom_reads WHERE local_date = ? AND wisdom_id = ?', args: [localDate, wisdomId] })).rows[0] as Record<string, unknown>; const result = { serverNow: Date.now(), date: localDate, timezone, wisdom: wisdomForDate(localDate), readAt: Number(row.read_at) }; await saveReceipt(tx, requestId, 'mark-wisdom-read', cached.hash, result); return result })
}
export function closeDbForTests() { database?.close(); database = undefined; initialization = undefined }
