export type RecoveryState = 'future' | 'current' | 'completed'

export interface RecoveryMilestone {
  id: string
  label: string
  description: string
  from: number
  until?: number
}

const minute = 60_000
const day = 86_400_000

/** Cautious, discrete orientation points derived from WHO cessation guidance. */
export const RECOVERY_MILESTONES: readonly RecoveryMilestone[] = [
  { id: '20-minutes', label: '20 хвилин', description: 'Частота серцебиття та артеріальний тиск знижуються.', from: 20 * minute },
  { id: '12-hours', label: '12 годин', description: 'Рівень чадного газу в крові повертається до норми.', from: 12 * 60 * minute },
  { id: '2-12-weeks', label: '2–12 тижнів', description: 'Поліпшуються кровообіг і функція легень.', from: 14 * day, until: 84 * day },
  { id: '1-9-months', label: '1–9 місяців', description: 'Кашель і задишка зменшуються.', from: 30 * day, until: 270 * day },
  { id: '1-year', label: '1 рік', description: 'Ризик ішемічної хвороби серця приблизно вдвічі нижчий, ніж у людини, яка продовжує курити.', from: 365 * day },
  { id: '5-15-years', label: '5–15 років', description: 'Ризик інсульту поступово знижується до рівня людини, яка не курить.', from: 5 * 365 * day, until: 15 * 365 * day },
  { id: '10-years', label: '10 років', description: 'Ризик раку легень приблизно вдвічі нижчий, ніж у людини, яка продовжує курити.', from: 10 * 365 * day },
  { id: '15-years', label: '15 років', description: 'Ризик ішемічної хвороби серця стає приблизно таким, як у людини, яка не курить.', from: 15 * 365 * day },
]

export interface RecoveryItem extends RecoveryMilestone { state: RecoveryState }
export interface RecoverySummary { items: RecoveryItem[], latestCompleted: RecoveryItem | null, currentOrNext: RecoveryItem | null }

export function recoveryForElapsed(elapsed: number): RecoverySummary {
  const safeElapsed = Math.max(0, elapsed)
  const items = RECOVERY_MILESTONES.map(item => ({
    ...item,
    state: safeElapsed < item.from ? 'future' : item.until !== undefined && safeElapsed < item.until ? 'current' : 'completed',
  } satisfies RecoveryItem))
  const completed = items.filter(item => item.state === 'completed')
  const current = items.filter(item => item.state === 'current')
  return {
    items,
    latestCompleted: completed.at(-1) || null,
    currentOrNext: current.at(-1) || items.find(item => item.state === 'future') || null,
  }
}

export function recoveryForJourney(startedAt: number, now = Date.now()) { return recoveryForElapsed(Math.max(0, now - startedAt)) }
