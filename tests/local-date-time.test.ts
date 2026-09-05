import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { localDateTimeToTimestamp, timestampToLocalDateTime } from '../shared/local-date-time'

const previousTimezone = process.env.TZ

beforeAll(() => {
  process.env.TZ = 'Europe/Sofia'
})

afterAll(() => {
  process.env.TZ = previousTimezone
})

describe('local civil date and time editing', () => {
  it.each([
    ['2026-01-01', '00:30'],
    ['2026-01-01', '00:01'],
    ['2026-01-01', '23:59'],
    ['2025-12-31', '23:59'],
  ])('keeps %s %s in Europe/Sofia across UTC boundaries', (date, time) => {
    const timestamp = localDateTimeToTimestamp(date, time)
    expect(timestampToLocalDateTime(timestamp)).toEqual({ date, time })
  })

  it('preserves the exact stored instant when an unchanged minute form is saved', () => {
    const stored = new Date(2025, 11, 31, 23, 59, 42, 517).getTime()
    const fields = timestampToLocalDateTime(stored)
    expect(localDateTimeToTimestamp(fields.date, fields.time, stored)).toBe(stored)
  })

  it('changes only the selected civil field', () => {
    const stored = localDateTimeToTimestamp('2026-01-01', '00:30')
    expect(timestampToLocalDateTime(localDateTimeToTimestamp('2026-01-02', '00:30', stored)))
      .toEqual({ date: '2026-01-02', time: '00:30' })
    expect(timestampToLocalDateTime(localDateTimeToTimestamp('2026-01-01', '23:59', stored)))
      .toEqual({ date: '2026-01-01', time: '23:59' })
  })

  it('rejects impossible or malformed civil values', () => {
    expect(localDateTimeToTimestamp('2026-02-30', '12:00')).toBeNaN()
    expect(localDateTimeToTimestamp('2026-01-01', '24:00')).toBeNaN()
    expect(localDateTimeToTimestamp('01/01/2026', '00:30')).toBeNaN()
  })
})
