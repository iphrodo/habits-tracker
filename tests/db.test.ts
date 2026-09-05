import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, rmSync } from 'node:fs'
import { closeDbForTests, createAttempt, createCravingEvent, newPath, trackerState, updateSettings } from '../server/utils/db'

const databasePath = '/tmp/vilno-db-test.sqlite'
process.env.STORAGE_TURSO_DATABASE_URL = `file:${databasePath}`
process.env.STORAGE_TURSO_AUTH_TOKEN = 'local-test-token'

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
    expect(first.history[0]!.finalSavedMoney).toBe(1.75)
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
})
