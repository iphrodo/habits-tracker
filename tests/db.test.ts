import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, rmSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { createError } from 'h3'
import { vi } from 'vitest'
import {
  closeDbForTests,
  createAttempt,
  createCravingEvent,
  newPath,
  restartAttempt,
  rowToSettings,
  trackerState,
  updateSettings,
} from '../server/utils/db'

const databasePath = '/tmp/vilno-db-test.sqlite'
process.env.STORAGE_TURSO_DATABASE_URL = `file:${databasePath}`
process.env.STORAGE_TURSO_AUTH_TOKEN = 'local-test-token'
vi.stubGlobal('createError', createError)

afterEach(() => {
  closeDbForTests()
  if (existsSync(databasePath)) rmSync(databasePath)
  if (existsSync(`${databasePath}-wal`)) rmSync(`${databasePath}-wal`)
  if (existsSync(`${databasePath}-shm`)) rmSync(`${databasePath}-shm`)
})

describe('tracker persistence', () => {
  it('migrates defaults, persists settings, freezes ended savings and keeps new-path requests idempotent', async () => {
    const startedAt = Date.now() - 12 * 3_600_000
    let state = await createAttempt(startedAt, 'Europe/Sofia', 'create-attempt-request')
    expect(state.settings.dailySmokingCost).toBe(7)
    state = await updateSettings('Хочу більше контролю', 8, 'settings-request')
    expect(state.settings).toMatchObject({ personalReason: 'Хочу більше контролю', dailySmokingCost: 8, currency: 'EUR' })
    const splitAt = startedAt + 6 * 3_600_000
    const requestId = 'new-path-request'
    const first = await newPath(splitAt, 'Europe/Sofia', state.activeAttempt!.version, 'coffee', 'Генін', requestId)
    const duplicate = await newPath(splitAt, 'Europe/Sofia', state.activeAttempt!.version, 'coffee', 'Генін', requestId)
    expect(duplicate).toEqual(first)
    expect(first.history).toHaveLength(1)
    expect(first.history[0]!.finalSavedMoney).toBe(2)
    expect(first.activeAttempt!.dailySmokingCostAtStart).toBe(8)
  })

  it('records optional triggers and exposes a neutral recent insight after repeated events', async () => {
    const state = await createAttempt(Date.now() - 3_600_000, 'Europe/Sofia', 'create-for-trigger')
    await createCravingEvent('coffee', 'Академія', 'trigger-request-one')
    await createCravingEvent('coffee', 'Академія', 'trigger-request-two')
    const latest = await trackerState()
    expect(latest.activeAttempt!.id).toBe(state.activeAttempt!.id)
    expect(latest.triggerInsight).toEqual({ trigger: 'coffee', count: 2 })
  })

  it.each([0, 7, 7.5])('roundtrips a valid daily cost of %s', async (cost) => {
    await createAttempt(Date.now() - 3_600_000, 'Europe/Sofia', `create-cost-${cost}`)
    await updateSettings(null, cost, `settings-cost-${cost}`)
    closeDbForTests()

    const state = await trackerState()
    expect(state.settings.dailySmokingCost).toBe(cost)
  })

  it('uses the default only for a missing or null legacy value', () => {
    expect(rowToSettings()).toMatchObject({ dailySmokingCost: 7, personalReason: null })
    expect(rowToSettings({ personal_reason: null, daily_smoking_cost: null })).toMatchObject({ dailySmokingCost: 7, personalReason: null })
    expect(rowToSettings({ personal_reason: null, daily_smoking_cost: 0 })).toMatchObject({ dailySmokingCost: 0, personalReason: null })
  })

  it('makes identical legacy restart retries successful without duplicate history', async () => {
    await createAttempt(Date.now() - 3_600_000, 'Europe/Sofia', 'legacy-create-request')
    const first = await restartAttempt('legacy-restart-request')
    const retryAfterLostResponse = await restartAttempt('legacy-restart-request')
    const persisted = await trackerState()

    expect(retryAfterLostResponse).toEqual(first)
    expect(persisted.history).toHaveLength(1)
    expect(persisted.activeAttempt!.startedAt).toBe(first.activeAttempt!.startedAt)
    expect(persisted.activeAttempt!.id).toBe(first.activeAttempt!.id)
  })

  it('rejects genuine idempotency-key reuse for another operation', async () => {
    await createAttempt(Date.now() - 3_600_000, 'Europe/Sofia', 'shared-request-id')
    await expect(restartAttempt('shared-request-id')).rejects.toMatchObject({ statusCode: 409 })
  })

  it('rolls back the completed-attempt update if a later write fails', async () => {
    const before = await createAttempt(Date.now() - 3_600_000, 'Europe/Sofia', 'atomic-create-request')
    await expect(newPath(
      Date.now() - 1_000,
      'Europe/Sofia',
      before.activeAttempt!.version,
      'invalid-trigger' as 'coffee',
      undefined,
      'atomic-new-path-request',
    )).rejects.toBeTruthy()

    const after = await trackerState()
    expect(after.history).toHaveLength(0)
    expect(after.activeAttempt).toEqual(before.activeAttempt)
  })

  it('keeps historical money fixed while current settings and attempts use the new cost', async () => {
    const start = Date.now() - 11 * 86_400_000
    let state = await createAttempt(start, 'Europe/Sofia', 'history-create-request')
    state = await newPath(start + 10 * 86_400_000, 'Europe/Sofia', state.activeAttempt!.version, undefined, undefined, 'history-new-path-request')
    expect(state.history[0]!.finalSavedMoney).toBe(70)

    state = await updateSettings(null, 8, 'history-settings-request')
    expect(state.history[0]!.finalSavedMoney).toBe(70)
    expect(state.activeAttempt!.dailySmokingCostAtStart).toBe(8)

    state = await newPath(start + 10.5 * 86_400_000, 'Europe/Sofia', state.activeAttempt!.version, undefined, undefined, 'history-next-path-request')
    expect(state.history[0]!.finalSavedMoney).toBe(4)
    expect(state.history[1]!.finalSavedMoney).toBe(70)
    expect(state.activeAttempt!.dailySmokingCostAtStart).toBe(8)
  })

  it('migrates an old database additively and remains idempotent', async () => {
    const raw = createClient({ url: `file:${databasePath}`, authToken: 'local-test-token' })
    await raw.execute('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)')
    await raw.execute(`CREATE TABLE attempts (id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, ended_at INTEGER, start_timezone TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`)
    await raw.execute('CREATE UNIQUE INDEX one_active_attempt ON attempts((1)) WHERE ended_at IS NULL')
    await raw.execute('CREATE TABLE milestone_acknowledgements (attempt_id TEXT NOT NULL, milestone_days INTEGER NOT NULL, acknowledged_at INTEGER NOT NULL, PRIMARY KEY (attempt_id, milestone_days))')
    await raw.execute('CREATE TABLE mutation_receipts (request_id TEXT PRIMARY KEY, operation TEXT NOT NULL, payload_hash TEXT NOT NULL, response_json TEXT NOT NULL, created_at INTEGER NOT NULL)')
    await raw.execute('CREATE TABLE daily_wisdom_reads (local_date TEXT NOT NULL, wisdom_id TEXT NOT NULL, read_at INTEGER NOT NULL, PRIMARY KEY (local_date, wisdom_id))')
    await raw.execute('INSERT INTO schema_migrations VALUES (1, 1), (2, 2)')
    await raw.execute({
      sql: 'INSERT INTO attempts VALUES (?, ?, NULL, ?, 1, ?, ?)',
      args: ['legacy-active', Date.now() - 86_400_000, 'Europe/Sofia', Date.now(), Date.now()],
    })
    raw.close()

    const first = await trackerState()
    expect(first.activeAttempt).toMatchObject({ id: 'legacy-active', dailySmokingCostAtStart: 7 })
    expect(first.settings).toEqual({ personalReason: null, dailySmokingCost: 7, currency: 'EUR' })
    closeDbForTests()

    const second = await trackerState()
    expect(second.activeAttempt).toMatchObject({ id: 'legacy-active', dailySmokingCostAtStart: 7 })
  })
})
