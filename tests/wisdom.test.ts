import { describe, expect, it } from 'vitest'
import { WISDOM_CATALOG, dateKeyInTimezone, wisdomForDate } from '../server/utils/wisdom'

describe('daily wisdom', () => {
  it('has a unique, stable 30-day rotation', () => {
    expect(WISDOM_CATALOG).toHaveLength(30)
    expect(new Set(WISDOM_CATALOG.map((item) => item.id)).size).toBe(30)
    const dates = Array.from({ length: 30 }, (_, day) => new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10))
    expect(new Set(dates.map((date) => wisdomForDate(date).id)).size).toBe(30)
    expect(wisdomForDate('2026-01-04')).toEqual(wisdomForDate('2026-01-04'))
  })

  it('uses calendar dates in the requested timezone', () => {
    const instant = Date.UTC(2026, 0, 1, 22, 30)
    expect(dateKeyInTimezone('Europe/Sofia', instant)).toBe('2026-01-02')
    expect(dateKeyInTimezone('America/New_York', instant)).toBe('2026-01-01')
  })
})
