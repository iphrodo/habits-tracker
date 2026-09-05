import { describe, expect, it } from 'vitest'
import type { Attempt } from '../server/utils/types'
import { journeyTotals } from '../server/utils/types'

const day = 86_400_000
function attempt(id: string, startedAt: number, endedAt: number | null, cost = 7, finalSavedMoney: number | null = null): Attempt {
  return { id, startedAt, endedAt, startTimezone: 'Europe/Sofia', version: 1, dailySmokingCostAtStart: cost, finalSavedMoney }
}

describe('whole-journey totals', () => {
  it('adds completed and current durations while excluding calendar gaps', () => {
    const history = [
      attempt('one', 0, 10 * day, 7, 70),
      attempt('two', 13 * day, 33 * day, 7, 140),
    ]
    const active = attempt('current', 38 * day, null, 7)
    const totals = journeyTotals(history, active, 43 * day)

    expect(totals.elapsedMilliseconds).toBe(35 * day)
    expect(totals.savedMoney).toBe(245)
  })

  it('supports completed-only, current-only, and zero-cost journeys', () => {
    expect(journeyTotals([attempt('done', 0, day, 7, 7)], null, 10 * day))
      .toEqual({ elapsedMilliseconds: day, savedMoney: 7 })
    expect(journeyTotals([], attempt('current', 0, null, 7), day))
      .toEqual({ elapsedMilliseconds: day, savedMoney: 7 })
    expect(journeyTotals([], attempt('free', 0, null, 0), 365 * day).savedMoney).toBe(0)
  })

  it('uses frozen completed savings and the active attempt cost basis', () => {
    const totals = journeyTotals(
      [attempt('old', 0, 10 * day, 7, 70)],
      attempt('current', 20 * day, null, 8),
      25 * day,
    )
    expect(totals.savedMoney).toBe(110)
  })
})
