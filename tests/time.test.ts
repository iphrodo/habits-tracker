import { describe, expect, it } from 'vitest'
import { elapsedParts, milestonePercent } from '../server/utils/types'

describe('elapsedParts', () => {
  it('counts completed 24-hour intervals rather than calendar days', () => {
    expect(elapsedParts(0, 23 * 3_600_000 + 59 * 60_000)).toEqual({ days: 0, hours: 23, minutes: 59 })
    expect(elapsedParts(0, 24 * 3_600_000)).toEqual({ days: 1, hours: 0, minutes: 0 })
  })

  it('does not return negative progress', () => {
    expect(elapsedParts(10_000, 1_000)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it('includes hours and minutes in progress toward the next milestone', () => {
    expect(milestonePercent({ days: 0, hours: 1, minutes: 27 }, 1)).toBeCloseTo(6.04, 2)
    expect(milestonePercent({ days: 0, hours: 23, minutes: 59 }, 1)).toBeCloseTo(99.93, 2)
  })
})
