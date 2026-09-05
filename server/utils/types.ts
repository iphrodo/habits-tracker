export interface Attempt {
  id: string
  startedAt: number
  endedAt: number | null
  startTimezone: string
  version: number
}

export interface TrackerState {
  serverNow: number
  activeAttempt: Attempt | null
  history: Attempt[]
  acknowledgedMilestones: number[]
}

export interface DailyWisdomState {
  serverNow: number
  date: string
  timezone: string
  wisdom: import('./wisdom').Wisdom
  readAt: number | null
}

export const MILESTONES = [1, 3, 7, 14, 30, 50, 100, 180, 365]

export function elapsedParts(startedAt: number, now = Date.now()) {
  const elapsed = Math.max(0, now - startedAt)
  const days = Math.floor(elapsed / 86_400_000)
  const remainder = elapsed % 86_400_000
  return { days, hours: Math.floor(remainder / 3_600_000), minutes: Math.floor((remainder % 3_600_000) / 60_000) }
}

export function assertStartTime(startedAt: unknown): asserts startedAt is number {
  if (typeof startedAt !== 'number' || !Number.isSafeInteger(startedAt) || startedAt <= 0 || startedAt > Date.now() + 2_000) {
    throw createError({ statusCode: 400, statusMessage: 'Оберіть коректну дату в минулому.' })
  }
}

export function assertTimezone(timezone: unknown): asserts timezone is string {
  if (typeof timezone !== 'string') throw createError({ statusCode: 400, statusMessage: 'Вкажіть часовий пояс.' })
  try { new Intl.DateTimeFormat('uk-UA', { timeZone: timezone }) } catch { throw createError({ statusCode: 400, statusMessage: 'Невідомий часовий пояс.' }) }
}

export function assertLocalDate(date: unknown): asserts date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw createError({ statusCode: 400, statusMessage: 'Некоректна дата картки.' })
  }
}
