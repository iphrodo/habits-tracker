import { describe, expect, it } from 'vitest'
import { NINJA_LEVELS, rankForDays } from '../shared/ranks'

describe('ninja ranks', () => {
  it('maps every agreed threshold to its rank', () => {
    expect(NINJA_LEVELS.map((rank) => rank.day)).toEqual([0, 1, 3, 7, 14, 30, 50, 100, 180, 365])
    expect(NINJA_LEVELS.map((rank) => rankForDays(rank.day).name)).toEqual(NINJA_LEVELS.map((rank) => rank.name))
  })

  it('keeps the final rank after a year and never returns a negative rank', () => {
    expect(rankForDays(-1).name).toBe('Академія')
    expect(rankForDays(999).name).toBe('Легенда Листа')
  })
})
