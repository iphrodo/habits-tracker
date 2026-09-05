import { describe, expect, it } from 'vitest'
import { NINJA_LEVELS, rankForDays, rankStatusForDay } from '../shared/ranks'

describe('ninja ranks', () => {
  it('maps every agreed threshold to its rank', () => {
    expect(NINJA_LEVELS.map((rank) => rank.day)).toEqual([0, 1, 3, 7, 14, 30, 60, 90, 180, 270, 365])
    expect(NINJA_LEVELS.map((rank) => rankForDays(rank.day).name)).toEqual(NINJA_LEVELS.map((rank) => rank.name))
  })

  it('keeps the final rank after a year and never returns a negative rank', () => {
    expect(rankForDays(-1).name).toBe('Академія')
    expect(rankForDays(999).name).toBe('Легенда Листа')
    expect(rankForDays(60).name).toBe('АНБУ')
    expect(rankForDays(90).name).toBe('Саннін')
    expect(rankForDays(270).name).toBe('Хранитель шляху')
  })

  it('exposes rank state with Ukrainian text instead of color alone', () => {
    expect(rankStatusForDay(0, 7)).toBe('Пройдений')
    expect(rankStatusForDay(7, 7)).toBe('Поточний')
    expect(rankStatusForDay(14, 7)).toBe('Майбутній')
  })
})
