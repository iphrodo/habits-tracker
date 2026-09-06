export type JourneyStage = 'early' | 'middle' | 'late'
export interface Practice { id: string, stages: JourneyStage[], text: string }

export const PRACTICE_CATALOG: readonly Practice[] = [
  { id: 'water-nearby', stages: ['early'], text: 'Постав воду поруч там, де зазвичай з’являється бажання.' },
  { id: 'one-minute', stages: ['early'], text: 'Перед звичним рухом дай собі одну тиху хвилину.' },
  { id: 'route-change', stages: ['early', 'middle'], text: 'Спробуй пройти звичний маршрут трохи інакше.' },
  { id: 'pause-name', stages: ['early', 'middle'], text: 'Поміть момент паузи й обери маленьку дію для себе.' },
  { id: 'free-space', stages: ['middle', 'late'], text: 'Залиши в дні кілька хвилин для того, що тобі справді важливо.' },
  { id: 'identity-note', stages: ['middle', 'late'], text: 'Згадай одну річ, яку вже стало легше обирати.' },
  { id: 'quiet-choice', stages: ['late'], text: 'Дозволь звичному вільному рішенню бути просто частиною дня.' },
  { id: 'share-space', stages: ['late'], text: 'Знайди короткий момент для людини або справи, якій хочеш приділити увагу.' },
]

export function stageForDays(days: number): JourneyStage { return days <= 6 ? 'early' : days <= 90 ? 'middle' : 'late' }
function index(key: string, size: number) { let hash = 2166136261; for (const char of key) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619) } return (hash >>> 0) % size }
export function practiceForDate(localDate: string, days: number): Practice {
  const stage = stageForDays(days)
  const eligible = PRACTICE_CATALOG.filter(practice => practice.stages.includes(stage))
  return eligible[index(`${localDate}:${stage}`, eligible.length)]!
}
