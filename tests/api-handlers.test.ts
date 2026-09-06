import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  trackerState: vi.fn(),
  updateSettings: vi.fn(),
  restartAttempt: vi.fn(),
  createCravingEvent: vi.fn(),
}))

vi.mock('../server/utils/db', () => db)

let requestBody: Record<string, unknown> = {}
const setResponseHeader = vi.fn()
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('readBody', async () => requestBody)
vi.stubGlobal('getHeader', () => undefined)
vi.stubGlobal('useRuntimeConfig', () => ({ trustedOrigin: '' }))
vi.stubGlobal('setResponseHeader', setResponseHeader)
vi.stubGlobal('createError', (input: Record<string, unknown>) => Object.assign(new Error(String(input.statusMessage)), input))

const trackerHandler = (await import('../server/api/tracker.get')).default as (event: unknown) => Promise<unknown>
const settingsHandler = (await import('../server/api/settings.patch')).default as (event: unknown) => Promise<unknown>
const restartHandler = (await import('../server/api/attempts/restart.post')).default as (event: unknown) => Promise<unknown>
const cravingHandler = (await import('../server/api/cravings.post')).default as (event: unknown) => Promise<unknown>

describe('API handlers', () => {
  beforeEach(() => {
    requestBody = {}
    vi.clearAllMocks()
  })

  it('returns the current tracker state and marks it no-store', async () => {
    const state = { activeAttempt: null, history: [{ id: 'history-entry' }] }
    db.trackerState.mockResolvedValue(state)
    await expect(trackerHandler({})).resolves.toEqual(state)
    expect(setResponseHeader).toHaveBeenCalledWith({}, 'Cache-Control', 'no-store')
  })

  it('propagates a controlled tracker storage error', async () => {
    const error = Object.assign(new Error('storage unavailable'), { statusCode: 503 })
    db.trackerState.mockRejectedValue(error)
    await expect(trackerHandler({})).rejects.toMatchObject({ statusCode: 503 })
  })

  it('accepts and forwards a zero daily cost', async () => {
    requestBody = { personalReason: null, dailySmokingCost: 0, requestId: 'settings-request' }
    db.updateSettings.mockResolvedValue({ settings: { dailySmokingCost: 0 } })
    await expect(settingsHandler({})).resolves.toEqual({ settings: { dailySmokingCost: 0 } })
    expect(db.updateSettings).toHaveBeenCalledWith(null, 0, 'settings-request')
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, '7'])('rejects invalid settings cost %s before persistence', async (dailySmokingCost) => {
    requestBody = { personalReason: null, dailySmokingCost, requestId: 'settings-request' }
    await expect(settingsHandler({})).rejects.toMatchObject({ statusCode: 400 })
    expect(db.updateSettings).not.toHaveBeenCalled()
  })

  it('keeps the legacy restart contract and returns an idempotent stored result', async () => {
    requestBody = { requestId: 'restart-request' }
    const state = { activeAttempt: { id: 'current' }, history: [{ id: 'previous' }] }
    db.restartAttempt.mockResolvedValue(state)
    await expect(restartHandler({})).resolves.toEqual(state)
    await expect(restartHandler({})).resolves.toEqual(state)
    expect(db.restartAttempt).toHaveBeenNthCalledWith(1, 'restart-request')
    expect(db.restartAttempt).toHaveBeenNthCalledWith(2, 'restart-request')
  })

  it('records a valid craving trigger and rejects an invalid one', async () => {
    requestBody = { trigger: 'coffee', rankKey: 'Генін', requestId: 'craving-request' }
    db.createCravingEvent.mockResolvedValue({ triggerInsight: null })
    await expect(cravingHandler({})).resolves.toEqual({ triggerInsight: null })
    expect(db.createCravingEvent).toHaveBeenCalledWith('coffee', 'Генін', 'craving-request')

    requestBody = { trigger: 'unknown', requestId: 'craving-request' }
    await expect(cravingHandler({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts optional enriched craving fields and rejects invalid intensity or coping values', async () => {
    requestBody = { trigger: 'coffee', rankKey: 'Генін', intensity: 5, copingMethod: 'water', requestId: 'enriched-request' }
    db.createCravingEvent.mockResolvedValue({ triggerInsight: null })
    await expect(cravingHandler({})).resolves.toEqual({ triggerInsight: null })
    expect(db.createCravingEvent).toHaveBeenCalledWith('coffee', 'Генін', 'enriched-request', 5, 'water')

    for (const intensity of [0, 6, 1.5]) {
      requestBody = { trigger: 'coffee', intensity, requestId: `bad-intensity-${intensity}` }
      await expect(cravingHandler({})).rejects.toMatchObject({ statusCode: 400 })
    }
    requestBody = { trigger: 'coffee', copingMethod: 'unknown', requestId: 'bad-coping' }
    await expect(cravingHandler({})).rejects.toMatchObject({ statusCode: 400 })
  })
})
