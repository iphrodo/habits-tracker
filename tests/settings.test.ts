import { describe, expect, it } from 'vitest'
import { parseSettingsUpdate } from '../server/utils/settings'

describe('settings input validation', () => {
  it.each([0, 7, 7.5])('accepts the finite daily cost %s', (dailySmokingCost) => {
    expect(parseSettingsUpdate({ personalReason: null, dailySmokingCost, requestId: 'request-id' }))
      .toMatchObject({ dailySmokingCost })
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, '7', null, undefined])('rejects the invalid daily cost %s', (dailySmokingCost) => {
    expect(parseSettingsUpdate({ personalReason: null, dailySmokingCost, requestId: 'request-id' })).toBeNull()
  })

  it('trims a reason, accepts an empty optional reason, and rejects overlong text', () => {
    expect(parseSettingsUpdate({ personalReason: '  Моя причина  ', dailySmokingCost: 7, requestId: 'request-id' })?.personalReason)
      .toBe('Моя причина')
    expect(parseSettingsUpdate({ personalReason: '', dailySmokingCost: 7, requestId: 'request-id' })?.personalReason)
      .toBeNull()
    expect(parseSettingsUpdate({ personalReason: 'а'.repeat(281), dailySmokingCost: 7, requestId: 'request-id' }))
      .toBeNull()
  })
})
