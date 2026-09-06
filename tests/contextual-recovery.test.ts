import { describe, expect, it } from 'vitest'
import { rankIntervalForDays } from '../shared/ranks'
import { recoveryForJourney } from '../shared/recovery'
import { practiceForDate } from '../server/utils/practice'
import { dateKeyInTimezone, wisdomForDate } from '../server/utils/wisdom'
import { selectCravingInsight } from '../server/utils/insights'

describe('contextual recovery support', () => {
  it('restarts rank reveal at each rank and keeps it bounded through the final rank', () => {
    expect(rankIntervalForDays(3).progress).toBe(0)
    expect(rankIntervalForDays(5).progress).toBe(50)
    expect(rankIntervalForDays(365).progress).toBe(100)
    expect(rankIntervalForDays(-5).progress).toBe(0)
  })

  it('uses exact point and range recovery boundaries from the active journey only', () => {
    const now = Date.UTC(2026, 0, 1)
    const state = (minutes: number) => recoveryForJourney(now - minutes * 60_000, now).items
    expect(state(0).every(item => item.state === 'future')).toBe(true)
    expect(state(19).find(item => item.id === '20-minutes')!.state).toBe('future')
    expect(state(20).find(item => item.id === '20-minutes')!.state).toBe('completed')
    expect(state(12 * 60).find(item => item.id === '12-hours')!.state).toBe('completed')
    expect(recoveryForJourney(now - (12 * 60 - 1) * 60_000, now).items.find(item => item.id === '12-hours')!.state).toBe('future')
    expect(state(13 * 60).find(item => item.id === '2-12-weeks')!.state).toBe('future')
    const weeks = recoveryForJourney(now - 14 * 86_400_000, now).items
    expect(weeks.find(item => item.id === '2-12-weeks')!.state).toBe('current')
    expect(recoveryForJourney(now - 84 * 86_400_000, now).items.find(item => item.id === '2-12-weeks')!.state).toBe('completed')
    expect(recoveryForJourney(now - 30 * 86_400_000, now).items.find(item => item.id === '1-9-months')!.state).toBe('current')
    expect(recoveryForJourney(now - 270 * 86_400_000, now).items.find(item => item.id === '1-9-months')!.state).toBe('completed')
    const final = recoveryForJourney(now - 15 * 365 * 86_400_000, now).items
    expect(final.every(item => item.state === 'completed')).toBe(true)
    expect(recoveryForJourney(now - 365 * 86_400_000, now).items.find(item => item.id === '1-year')!.state).toBe('completed')
    expect(recoveryForJourney(now - 5 * 365 * 86_400_000, now).items.find(item => item.id === '5-15-years')!.state).toBe('current')
    expect(recoveryForJourney(now - 10 * 365 * 86_400_000, now).items.find(item => item.id === '10-years')!.state).toBe('completed')
  })

  it('keeps practice local-date stable and stage-filtered without completion metadata', () => {
    const early = practiceForDate('2026-02-01', 2)
    expect(practiceForDate('2026-02-01', 2)).toEqual(early)
    expect(early.stages).toContain('early')
    expect('completed' in early).toBe(false)
    expect(practiceForDate('2026-02-01', 120).stages).toContain('late')
    expect(new Set(Array.from({ length: 8 }, (_, day) => practiceForDate(`2026-02-${String(day + 1).padStart(2, '0')}`, 2).id)).size).toBeGreaterThan(1)
    const instant = Date.UTC(2026, 0, 1, 22, 30)
    expect(dateKeyInTimezone('Europe/Sofia', instant)).toBe('2026-01-02')
  })

  it('excludes recovery wisdom on a first start and includes it for a recent restart', () => {
    const first = Array.from({ length: 30 }, (_, day) => wisdomForDate(`2026-03-${String(day + 1).padStart(2, '0')}`, { elapsedDays: 1, recentRestart: false }))
    expect(first.some(item => item.category === 'відновлення')).toBe(false)
    const restart = Array.from({ length: 60 }, (_, day) => wisdomForDate(`2026-04-${String((day % 30) + 1).padStart(2, '0')}`, { elapsedDays: 1, recentRestart: true }))
    expect(restart.some(item => item.category === 'відновлення')).toBe(true)
    expect(new Set(first.map(item => item.id)).size).toBeGreaterThan(1)
  })

  it('requires five events and never fabricates a tied craving pattern', () => {
    expect(selectCravingInsight([{ trigger: 'coffee', intensity: null, copingMethod: null }])).toBeNull()
    expect(selectCravingInsight(Array.from({ length: 5 }, () => ({ trigger: 'coffee', intensity: 4, copingMethod: null })))).toMatchObject({ kind: 'trigger', key: 'coffee' })
    expect(selectCravingInsight(['coffee', 'stress', 'coffee', 'stress', 'habit'].map(trigger => ({ trigger, intensity: null, copingMethod: null })))).toBeNull()
  })
})
