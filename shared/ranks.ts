export const NINJA_LEVELS = [
  { day: 0, name: 'Академія', japanese: '忍者アカデミー', note: 'Перший крок уже робить тебе шинобі.', art: 'academy' },
  { day: 1, name: 'Генін', japanese: '下忍', note: 'Ти пройшов перший день. Тримай свій шлях.', art: 'genin' },
  { day: 3, name: 'Команда шинобі', japanese: '忍の班', note: 'Тепер твоя рішучість має ритм.', art: 'team' },
  { day: 7, name: 'Чунін', japanese: '中忍', note: 'Тиждень витримки — це вже сила.', art: 'chunin' },
  { day: 14, name: 'Токубецу джонін', japanese: '特別上忍', note: 'Ти вчишся володіти своїм вибором.', art: 'tokubetsu' },
  { day: 30, name: 'Джонін', japanese: '上忍', note: 'Місяць спокійної дисципліни за твоїми плечима.', art: 'jonin' },
  { day: 50, name: 'АНБУ', japanese: '暗部', note: 'Твоя витримка працює тихо й точно.', art: 'anbu' },
  { day: 100, name: 'Саннін', japanese: '伝説の三忍', note: 'Сто днів. Ти вже створив нову опору.', art: 'sannin' },
  { day: 180, name: 'Каге', japanese: '影', note: 'Ти ведеш власне життя в потрібний бік.', art: 'kage' },
  { day: 365, name: 'Легенда Листа', japanese: '木ノ葉の伝説', note: 'Рік вільного шляху. Це справжня легенда.', art: 'legend' },
] as const

export function rankForDays(days: number) {
  return [...NINJA_LEVELS].reverse().find((item) => item.day <= Math.max(0, days)) || NINJA_LEVELS[0]!
}
