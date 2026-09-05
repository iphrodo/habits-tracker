import { describe, expect, it } from 'vitest'
import { elapsedParts, formatMoney, milestonePercent, savedMoney } from '../server/utils/types'

describe('elapsedParts', () => {
  it('counts completed 24-hour intervals rather than calendar days', () => {
    expect(elapsedParts(0, 23 * 3_600_000 + 59 * 60_000)).toEqual({ days: 0, hours: 23, minutes: 59 })
    expect(elapsedParts(0, 24 * 3_600_000)).toEqual({ days: 1, hours: 0, minutes: 0 })
  })

  it('calculates proportional savings and never returns a negative amount', () => {
    const hour = 3_600_000
    expect(savedMoney(0, 7, hour)).toBeCloseTo(0.2916667, 6)
    expect(savedMoney(0, 7, 6 * hour)).toBe(1.75)
    expect(savedMoney(0, 7, 12 * hour)).toBe(3.5)
    expect(savedMoney(0, 7, 24 * hour)).toBe(7)
    expect(savedMoney(0, 7, 7 * 24 * hour)).toBe(49)
    expect(savedMoney(0, 7, 30 * 24 * hour)).toBe(210)
    expect(savedMoney(0, 7, 180 * 24 * hour)).toBe(1_260)
    expect(savedMoney(0, 7, 365 * 24 * hour)).toBe(2_555)
    expect(savedMoney(0, 0, 365 * 24 * hour)).toBe(0)
    expect(savedMoney(10_000, 7, 1_000)).toBe(0)
  })

  it.each([
    [0, { days: 0, hours: 0, minutes: 0 }],
    [60_000, { days: 0, hours: 0, minutes: 1 }],
    [3_600_000, { days: 0, hours: 1, minutes: 0 }],
    [6 * 3_600_000, { days: 0, hours: 6, minutes: 0 }],
    [12 * 3_600_000, { days: 0, hours: 12, minutes: 0 }],
    [86_400_000 + 12 * 3_600_000, { days: 1, hours: 12, minutes: 0 }],
    [7 * 86_400_000, { days: 7, hours: 0, minutes: 0 }],
    [30 * 86_400_000, { days: 30, hours: 0, minutes: 0 }],
    [180 * 86_400_000, { days: 180, hours: 0, minutes: 0 }],
    [365 * 86_400_000, { days: 365, hours: 0, minutes: 0 }],
    [408 * 86_400_000, { days: 408, hours: 0, minutes: 0 }],
  ])('decomposes %i milliseconds exactly', (milliseconds, expected) => {
    expect(elapsedParts(0, milliseconds)).toEqual(expected)
  })

  it('keeps full precision internally and rounds only when formatting', () => {
    const internal = savedMoney(0, 7, 60 * 60_000)
    expect(internal).toBeCloseTo(0.2916666667, 9)
    expect(formatMoney(internal)).toMatch(/0,29/)
    expect(formatMoney(10_000)).toMatch(/10[^\d]?000,00/)
  })

  it('does not return negative progress', () => {
    expect(elapsedParts(10_000, 1_000)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it('includes hours and minutes in progress toward the next milestone', () => {
    expect(milestonePercent({ days: 0, hours: 1, minutes: 27 }, 1)).toBeCloseTo(6.04, 2)
    expect(milestonePercent({ days: 0, hours: 23, minutes: 59 }, 1)).toBeCloseTo(99.93, 2)
  })
})
