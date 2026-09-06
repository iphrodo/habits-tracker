export const NINJA_LEVELS = [
  { day: 0, name: 'Академія', japanese: '忍者アカデミー', note: 'Сьогодні достатньо просто продовжити.', art: 'academy' },
  { day: 1, name: 'Генін', japanese: '下忍', note: 'Ти пройшов перший день. Це вже твій досвід.', art: 'genin' },
  { day: 3, name: 'Команда шинобі', japanese: '忍の班', note: 'Ти поступово повертаєш собі вибір.', art: 'team' },
  { day: 7, name: 'Чунін', japanese: '中忍', note: 'Новий ритм уже знаходить місце у твоєму дні.', art: 'chunin' },
  { day: 14, name: 'Токубецу джонін', japanese: '特別上忍', note: 'Бажання можна відчути, не виконуючи його.', art: 'tokubetsu' },
  { day: 30, name: 'Джонін', japanese: '上忍', note: 'Сигарети займають усе менше місця у твоїх рішеннях.', art: 'jonin' },
  { day: 60, name: 'АНБУ', japanese: '暗部', note: 'Твій контроль працює тихо, без зайвого шуму.', art: 'anbu' },
  { day: 90, name: 'Саннін', japanese: '伝説の三忍', note: 'Ти вже вмієш діяти інакше у складні моменти.', art: 'sannin' },
  { day: 180, name: 'Каге', japanese: '影', note: 'Ти ведеш своє життя у потрібний бік.', art: 'kage' },
  { day: 270, name: 'Хранитель шляху', japanese: '道の守り手', note: 'Свобода стає звичайною частиною твого життя.', art: 'guardian' },
  { day: 365, name: 'Легенда Листа', japanese: '木ノ葉の伝説', note: 'Це вже не лише час. Це твій спосіб життя.', art: 'legend' },
] as const

export function rankForDays(days: number) {
  return [...NINJA_LEVELS].reverse().find((item) => item.day <= Math.max(0, days)) || NINJA_LEVELS[0]!
}

export interface RankInterval {
  current: (typeof NINJA_LEVELS)[number]
  next: (typeof NINJA_LEVELS)[number] | null
  progress: number
}

/** Progress in the selected rank's own interval, rather than since day zero. */
export function rankIntervalForDays(days: number): RankInterval {
  const elapsed = Math.max(0, days)
  const current = rankForDays(elapsed)
  const index = NINJA_LEVELS.findIndex(rank => rank.day === current.day)
  const next = NINJA_LEVELS[index + 1] || null
  if (!next) return { current, next: null, progress: 100 }
  return {
    current,
    next,
    progress: Math.max(0, Math.min(100, (elapsed - current.day) / (next.day - current.day) * 100)),
  }
}

export function rankStatusForDay(rankDay: number, elapsedDays: number) {
  const current = rankForDays(elapsedDays)
  if (rankDay < current.day) return 'Пройдений'
  if (rankDay === current.day) return 'Поточний'
  return 'Майбутній'
}
